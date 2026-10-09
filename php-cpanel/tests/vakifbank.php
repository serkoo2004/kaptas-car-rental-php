<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/app/bootstrap.php';
session_write_close();

use Kaptas\Controllers\PaymentController;
use Kaptas\Core\Config;
use Kaptas\Core\Database;
use Kaptas\Services\RentalCheckout;
use Kaptas\Services\VakifBank;

if (Config::isProduction() || !in_array(Config::get('database.host'), ['localhost', '127.0.0.1', '::1'], true)) throw new RuntimeException('Yalnizca yerel test ortami.');
$checks = 0;
function verify(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException($message);
    $checks++;
}
function reject(callable $test, string $message): void {
    try { $test(); } catch (DomainException | InvalidArgumentException | RuntimeException $error) { verify(true, $message); return; }
    verify(false, $message);
}

// Temporary tables shadow real tables only in this connection; retain payment/period checks.
$pdo = Database::connection();
$pdo->exec("CREATE TEMPORARY TABLE Reservation (id VARCHAR(191) PRIMARY KEY, vehicleId VARCHAR(191), userId VARCHAR(191), quoteRequestId VARCHAR(191) UNIQUE, paymentIntentId VARCHAR(191) UNIQUE, status ENUM('HOLD','CONFIRMED','CANCELLED','EXPIRED'), pickupAt DATETIME(3), dropoffAt DATETIME(3), pickupLocation VARCHAR(191), dropoffLocation VARCHAR(191), holdExpiresAt DATETIME(3), customerName VARCHAR(191), customerEmail VARCHAR(191), customerPhone VARCHAR(191), createdAt DATETIME(3), updatedAt DATETIME(3), CHECK (dropoffAt>pickupAt), CHECK (status<>'HOLD' OR holdExpiresAt IS NOT NULL)) ENGINE=InnoDB");
$pdo->exec("CREATE TEMPORARY TABLE PaymentIntent (id VARCHAR(191) PRIMARY KEY, userId VARCHAR(191), quoteRequestId VARCHAR(191), provider VARCHAR(191), amount DECIMAL(12,2) CHECK (amount>0), currency VARCHAR(191), status ENUM('PENDING','AUTHORIZED','PAID','REVIEW_REQUIRED','FAILED','CANCELLED','REFUNDED'), providerRef VARCHAR(191), createdAt DATETIME(3), updatedAt DATETIME(3)) ENGINE=InnoDB");
$pdo->exec('CREATE TEMPORARY TABLE ConsentRecord (id VARCHAR(191) PRIMARY KEY, userId VARCHAR(191), email VARCHAR(191), type VARCHAR(191), version VARCHAR(191), acceptedAt DATETIME(3), ipAddress VARCHAR(191), userAgent VARCHAR(191)) ENGINE=InnoDB');
$pdo->exec('CREATE TEMPORARY TABLE Vehicle (id VARCHAR(191) PRIMARY KEY, title VARCHAR(255), dailyPrice DECIMAL(12,2), stockCount INT, status VARCHAR(30), isPublishedWeb TINYINT) ENGINE=InnoDB');
$pdo->exec('CREATE TEMPORARY TABLE QuoteRequest (id VARCHAR(191) PRIMARY KEY, userId VARCHAR(191)) ENGINE=InnoDB');
$pdo->exec('CREATE TEMPORARY TABLE QuoteRequestItem (quoteRequestId VARCHAR(191), vehicleId VARCHAR(191)) ENGINE=InnoDB');
$pdo->exec('CREATE TEMPORARY TABLE BranchLocation (id VARCHAR(191) PRIMARY KEY, name VARCHAR(191), isActive TINYINT) ENGINE=InnoDB');
foreach (['007_reservation_mail', '008_vakifbank_payments'] as $migration) {
    $sql = str_replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMPORARY TABLE IF NOT EXISTS', file_get_contents(dirname(__DIR__) . '/database/migrations/' . $migration . '.sql'));
    $pdo->exec($sql); $pdo->exec($sql);
}
$pdo->exec("INSERT INTO Vehicle VALUES ('v1','Duster',100.00,1,'PUBLISHED',1); INSERT INTO BranchLocation VALUES ('branch','Airport',1)");
$checkout = new RentalCheckout($pdo);
$user = ['id' => 'customer', 'role' => 'ADMIN'];
$rates = ['asOf' => date('Y-m-d'), 'provider' => 'test-fixture', 'stale' => false, 'rates' => [['code' => 'USD', 'selling' => 40], ['code' => 'EUR', 'selling' => 44]]];
$rental = ['vehicleId' => 'v1', 'pickupLocationId' => 'branch', 'pickupDate' => date('Y-m-d', time() + 10 * 86400), 'pickupTime' => '09:00', 'dropoffDate' => date('Y-m-d', time() + 12 * 86400), 'dropoffTime' => '09:00'];
$details = ['contactName' => 'Test Customer', 'contactEmail' => 'nobody@example.test', 'contactPhone' => '+905550000000', 'address' => 'Test Street 10', 'city' => 'Trabzon', 'zipCode' => '61000'];
$newQuote = static function (string $id) use ($pdo, $checkout, $rental, $user, $rates): array {
    $pdo->prepare('INSERT INTO QuoteRequest VALUES (?, ?)')->execute([$id, $user['id']]);
    $pdo->prepare("INSERT INTO QuoteRequestItem VALUES (?, 'v1')")->execute([$id]);
    return $checkout->quote($rental + ['leadId' => $id], $user, [], $rates);
};

verify(!VakifBank::available(null), 'Disabled provider rejects customers');
$quote = $newQuote('lead1');
verify($quote['amount'] === '8000.00' && $quote['days'] === 2 && $quote['currency'] === 'TRY', 'Server computes daily USD x days x FX, charges TRY');
verify($quote['dailyUsd'] === '100.00', 'Quote exposes admin daily price for the displayed breakdown');
$longer = $checkout->quote(array_replace($rental, ['leadId' => 'lead1', 'dropoffDate' => date('Y-m-d', time() + 13 * 86400)]), $user, [], $rates);
verify($longer['days'] === 3 && $longer['amount'] === '12000.00', 'Changing dates recalculates daily price times duration');
$q = RentalCheckout::decodeQuote($quote['quoteToken']);
reject(fn () => RentalCheckout::decodeQuote($quote['quoteToken'] . '0'), 'Tampered quote rejected');
reject(fn () => $checkout->quote($rental + ['leadId' => 'lead1'], ['id' => 'stranger'], [], $rates), 'Foreign lead rejected');
reject(fn () => $checkout->quote($rental + ['leadId' => 'lead1'], $user, [], array_replace($rates, ['stale' => true])), 'Stale FX rejected');
verify(RentalCheckout::owns(['id' => 'guest', 'userId' => null], null, ['guest']), 'Guest lead bound to originating session');
verify(!RentalCheckout::owns(['id' => 'guest', 'userId' => null], null, []), 'Guessed guest ID insufficient');

$prepared = $checkout->prepare($q, $details, $user, [], '127.0.0.1');
$attempt = $prepared['attempt'];
verify($attempt['environment'] === 'test', 'Default environment is sandbox');
verify((int) $pdo->query('SELECT COUNT(*) FROM ConsentRecord')->fetchColumn() === 4, 'All four consent records saved');
verify(!str_contains($attempt['snapshot'], 'cardNumber') && !str_contains($attempt['snapshot'], 'password'), 'Snapshot excludes card/credentials');
reject(fn () => $checkout->prepare($q, $details, $user, [], '127.0.0.1'), 'Duplicate checkout blocks second intent');
$quote2 = $newQuote('lead2');
reject(fn () => $checkout->prepare(RentalCheckout::decodeQuote($quote2['quoteToken']), $details, $user, [], '127.0.0.1'), 'Occupied stock rejects overlapping customer');
verify((int) $pdo->query('SELECT COUNT(*) FROM PaymentIntent')->fetchColumn() === 1, 'Rejected preparation rolls back without stray payment');

$card = VakifBank::validateCard(['cardNumber' => '4938 4101 0906 8353', 'expiryMonth' => '12', 'expiryYear' => '2029']);
verify($card['ExpiryDate'] === '2912', 'Bank expiry format YYMM');
reject(fn () => VakifBank::validateCard(['cardNumber' => '4938410109068354', 'expiryMonth' => '12', 'expiryYear' => '2029']), 'Luhn validation');
reject(fn () => VakifBank::validateCard(['cardNumber' => '4938410109068353', 'expiryMonth' => '00', 'expiryYear' => '2029']), 'Invalid expiry month');
$challengeBytes = '<form method="POST"></form>' . "\xFB\xFF";
$challenge = ['Status' => 'Y', 'ResultCode' => '0000', 'VerifyEnrollmentRequestId' => $attempt['transactionId'], 'ACSUrl' => VakifBank::endpoint('challenge', 'test'), 'Pareq' => base64_encode($challengeBytes), 'MD' => 'opaque-md'];
verify(VakifBank::challenge($challenge, $attempt)['fields']['MD'] === 'opaque-md', 'Challenge data handled as fields');
$encodedChallenge = VakifBank::challenge($challenge, $attempt)['fields']['PaReq'];
verify(preg_match('/^[A-Za-z0-9_-]+$/D', $encodedChallenge) === 1, 'Standard Base64 is converted to unpadded Base64URL');
verify(base64_decode(strtr($encodedChallenge, '-_', '+/'), true) === $challengeBytes, 'Challenge bytes are preserved exactly');
$emv = array_replace($challenge, ['Pareq' => $encodedChallenge, 'MessageErrorCode' => 200, 'ErrorMessage' => '']);
unset($emv['ResultCode']);
verify(VakifBank::challenge($emv, $attempt)['fields']['PaReq'] === $encodedChallenge, 'Observed EMV envelope without ResultCode accepted');
verify(VakifBank::challenge(array_replace($emv, ['MessageErrorCode' => '200']), $attempt)['fields']['PaReq'] === $encodedChallenge, 'String EMV success code accepted');
reject(fn () => VakifBank::challenge(array_replace($emv, ['MessageErrorCode' => null]), $attempt), 'Status Y alone is not proof of success');
reject(fn () => VakifBank::challenge(array_replace($emv, ['ResultCode' => '9999']), $attempt), 'Explicit bank failure cannot be overridden by message success');
reject(fn () => VakifBank::challenge(array_replace($challenge, ['MessageErrorCode' => '500']), $attempt), 'Contradictory message failure rejected');
reject(fn () => VakifBank::challenge(array_replace($emv, ['ErrorMessage' => 'Declined']), $attempt), 'Error message is not ignored');
reject(fn () => VakifBank::challenge(array_replace($emv, ['VerifyEnrollmentRequestId' => 'wrong']), $attempt), 'EMV transaction identity still checked');
foreach (['not valid base64!', 'A', 'Zh=='] as $badEncoding) {
    reject(fn () => VakifBank::challenge(array_replace($challenge, ['Pareq' => $badEncoding]), $attempt), 'Malformed or noncanonical PaReq rejected');
}
verify(VakifBank::challenge(array_replace($challenge, ['ACSUrl' => str_replace(':8443/', '/', $challenge['ACSUrl'])]), $attempt)['action'] === str_replace(':8443/', '/', $challenge['ACSUrl']), 'Actual bank response using HTTPS 443 is supported');
reject(fn () => VakifBank::challenge(array_replace($challenge, ['ACSUrl' => 'https://evil.example/']), $attempt), 'Bank redirect allowlist');
reject(fn () => VakifBank::challenge(array_replace($challenge, ['Status' => 'N']), $attempt), 'Enrollment failure rejected');

$callback = ['VerifyEnrollmentRequestId' => $attempt['transactionId'], 'MerchantId' => $attempt['merchantId'], 'PurchCurrency' => '949', 'PurchAmount' => '8000.00', 'Eci' => '05', 'Cavv' => 'test-cavv', 'MdStatus' => '1', 'Status' => 'Y'];
$sign = static function (array $f): array {
    $text = $f['VerifyEnrollmentRequestId'] . $f['MerchantId'] . $f['PurchCurrency'] . VakifBank::minor($f['PurchAmount']) . str_pad($f['Eci'], 2, '0', STR_PAD_LEFT) . $f['Cavv'] . $f['MdStatus'] . $f['Status'] . '123456';
    $f['Hash'] = base64_encode(hash('sha256', iconv('UTF-8', 'ISO-8859-9', $text), true));
    return $f;
};
$valid = $sign($callback);
verify(VakifBank::verifiedCallback($valid, $attempt)['ECI'] === '05', 'Signed full secure callback accepted');
foreach (['Hash' => 'bad', 'PurchAmount' => '1.00', 'MerchantId' => 'wrong', 'PurchCurrency' => '840', 'VerifyEnrollmentRequestId' => 'wrong'] as $key => $value) {
    reject(fn () => VakifBank::verifiedCallback(array_replace($valid, [$key => $value]), $attempt), 'Reject mismatched callback ' . $key);
}
foreach (['Status' => 'N', 'Eci' => '07', 'MdStatus' => '2', 'Cavv' => ''] as $key => $value) {
    verify(!VakifBank::verifiedCallback($sign(array_replace($callback, [$key => $value])), $attempt)['authenticated'], 'Do not charge correctly signed but unsafe ' . $key);
}
reject(fn () => VakifBank::sale($attempt, ['authenticated' => false]), 'Sale rejects non-authenticated input before network');
$checkout->challengeReady($attempt['paymentId']);
verify($checkout->claim($attempt, $prepared['returnToken']), 'First callback claims one sale');
verify(!$checkout->claim($attempt, $prepared['returnToken']), 'Repeated callback cannot charge again');
reject(fn () => $checkout->claim($attempt, str_repeat('0', 64)), 'Invalid state token rejected');
$checkout->failBeforeSale($attempt['paymentId']);
verify($checkout->attempt($attempt['paymentId'])['state'] === 'PROCESSING', 'Timeout cleanup cannot cancel submitted sale');

$searchXml = static function (array $a, string $extra = ''): string {
    $q = json_decode($a['snapshot'], true);
    return '<SearchResponse><ResponseInfo><ResponseCode>0000</ResponseCode></ResponseInfo><TransactionSearchResultInfo><TransactionSearchResultInfo>'
        . '<TransactionId>' . $a['transactionId'] . '</TransactionId><MerchantId>' . $a['merchantId'] . '</MerchantId><OrderId>' . $a['reservationId'] . '</OrderId>'
        . '<TransactionType>Sale</TransactionType><AmountCode>949</AmountCode><Amount>' . $q['amount'] . '</Amount><ResultCode>0000</ResultCode>'
        . '<ECI>05</ECI><AuthCode>123</AuthCode><IsCanceled>false</IsCanceled><IsRefunded>false</IsRefunded><IsReversed>false</IsReversed>'
        . $extra . '</TransactionSearchResultInfo></TransactionSearchResultInfo></SearchResponse>';
};
$search = $searchXml($attempt);
verify(VakifBank::verifiedSearch($search, $attempt)['paid'], 'Matching server-side search confirms payment');
reject(fn () => VakifBank::verifiedSearch(str_replace('<Amount>8000.00', '<Amount>1.00', $search), $attempt), 'Search amount mismatch');
reject(fn () => VakifBank::verifiedSearch(str_replace('<IsRefunded>false', '<IsRefunded>true', $search), $attempt), 'Refunded sale cannot confirm booking');
reject(fn () => VakifBank::verifiedSearch('<!DOCTYPE foo>' . $search, $attempt), 'Unsafe XML rejected');
verify(VakifBank::verifiedSearch('<SearchResponse><ResponseInfo><ResponseCode>0000</ResponseCode></ResponseInfo></SearchResponse>', $attempt) === null, 'Unknown search is not a decline or success');
$checkout->settle($attempt, ['paid' => true, 'code' => '0000']);
verify($checkout->attempt($attempt['paymentId'])['state'] === 'TEST_PAID', 'Sandbox records test success');
verify($pdo->query('SELECT status FROM Reservation')->fetchColumn() === 'CANCELLED', 'Sandbox never creates confirmed booking');
verify((int) $pdo->query('SELECT COUNT(*) FROM PhpReservationMail')->fetchColumn() === 0, 'Sandbox sends no customer confirmation');
verify($pdo->query('SELECT status FROM PaymentIntent')->fetchColumn() === 'CANCELLED', 'Sandbox contributes no paid revenue');

// Simulate trusted bank results, never call the network or move real money.
$livePrepared = $checkout->prepare(RentalCheckout::decodeQuote($quote2['quoteToken']), $details, $user, [], '127.0.0.1');
$live = $livePrepared['attempt'];
$live['environment'] = 'live';
$pdo->prepare("UPDATE PhpVposAttempt SET environment='live', state='PROCESSING' WHERE paymentId=?")->execute([$live['paymentId']]);
$checkout->settle($live, ['paid' => true, 'code' => '0000']);
verify($checkout->attempt($live['paymentId'])['state'] === 'PAID', 'Live verified payment finalizes');
// settle is the bank/worker path; no AdminController or manual confirmation is involved.
$confirmedRead = $pdo->prepare('SELECT r.status, p.status AS paymentStatus FROM Reservation r JOIN PaymentIntent p ON p.id=r.paymentIntentId WHERE p.id=?');
$confirmedRead->execute([$live['paymentId']]);
$confirmedRow = $confirmedRead->fetch(PDO::FETCH_ASSOC);
verify($confirmedRow['status'] === 'CONFIRMED' && $confirmedRow['paymentStatus'] === 'PAID', 'Verified live payment automatically confirms its own booking without admin action');
verify((int) $pdo->query("SELECT COUNT(*) FROM Reservation WHERE status='CONFIRMED'")->fetchColumn() === 1, 'Exactly one confirmed reservation');
verify((int) $pdo->query('SELECT COUNT(*) FROM PhpReservationMail')->fetchColumn() === 1, 'Receipt queued atomically with booking');
$checkout->settle($live, ['paid' => true, 'code' => '0000']);
verify((int) $pdo->query('SELECT COUNT(*) FROM PhpReservationMail')->fetchColumn() === 1, 'Duplicate settlement cannot duplicate receipt');

$pdo->exec('UPDATE Vehicle SET stockCount=2');
$quote3 = $newQuote('lead3');
$late = $checkout->prepare(RentalCheckout::decodeQuote($quote3['quoteToken']), $details, $user, [], '127.0.0.1')['attempt'];
$late['environment'] = 'live';
$pdo->prepare("UPDATE PhpVposAttempt SET environment='live', state='PROCESSING' WHERE paymentId=?")->execute([$late['paymentId']]);
$pdo->exec('UPDATE Vehicle SET stockCount=1');
$checkout->settle($late, ['paid' => true, 'code' => '0000']);
verify($checkout->attempt($late['paymentId'])['state'] === 'REVIEW_STOCK', 'Late payment with no capacity requires review/refund');
verify((int) $pdo->query('SELECT COUNT(*) FROM PhpReservationMail')->fetchColumn() === 1, 'No misleading confirmation for stock conflict');

$expires = (string) (time() + 600);
$token = hash_hmac('sha256', 'payment-result|' . $live['paymentId'] . '|' . $expires, (string) Config::get('app.secret'));
verify(PaymentController::canView($live['paymentId'], ['expires' => $expires, 'view' => $token]), 'Guest result link is signed');
verify(!PaymentController::canView('other', ['expires' => $expires, 'view' => $token]), 'Result link bound to one payment');
echo "OK: {$checks} VakifBank checks; temporary tables only, no bank requests or email.\n";
