<?php

declare(strict_types=1);

namespace Kaptas\Services;

use DateTimeImmutable;
use DomainException;
use Kaptas\Core\Config;
use Kaptas\Core\Id;
use PDO;
use Throwable;

final class RentalCheckout
{
    public function __construct(private PDO $pdo) {}

    public static function owns(array $lead, ?array $user, array $sessionLeads): bool
    {
        return ($user && !empty($lead['userId']) && $lead['userId'] === $user['id']) || in_array($lead['id'], $sessionLeads, true);
    }

    public function quote(array $input, ?array $user, array $sessionLeads, ?array $rates = null): array
    {
        $read = $this->pdo->prepare("SELECT q.id, q.userId, v.id AS vehicleId, v.title, v.dailyPrice FROM QuoteRequest q JOIN QuoteRequestItem qi ON qi.quoteRequestId = q.id JOIN Vehicle v ON v.id = qi.vehicleId WHERE q.id = ? AND v.id = ? AND v.status = 'PUBLISHED' AND v.isPublishedWeb = 1 LIMIT 1");
        $read->execute([(string) ($input['leadId'] ?? ''), (string) ($input['vehicleId'] ?? '')]);
        $lead = $read->fetch(PDO::FETCH_ASSOC);
        if (!$lead || !self::owns($lead, $user, $sessionLeads)) throw new DomainException('Kiralama talebine erisim yok. Arac filosundan yeniden baslayin.');
        $period = RentalPeriod::parse((string) ($input['pickupDate'] ?? ''), (string) ($input['pickupTime'] ?? ''), (string) ($input['dropoffDate'] ?? ''), (string) ($input['dropoffTime'] ?? ''));
        $branch = $this->pdo->prepare('SELECT id, name FROM BranchLocation WHERE id = ? AND isActive = 1');
        $branch->execute([(string) ($input['pickupLocationId'] ?? '')]);
        $location = $branch->fetch(PDO::FETCH_ASSOC);
        if (!$location || (float) $lead['dailyPrice'] <= 0) throw new DomainException('Teslim noktasi veya arac fiyati gecersiz.');
        if ($rates === null) {
            try { $rates = ExchangeRates::snapshot(false); }
            catch (Throwable) { throw new DomainException('Güncel döviz kuru alınamadığı için toplam hesaplanamadı. Lütfen tekrar deneyin.'); }
        }
        if ($rates['stale'] ?? true) throw new DomainException('Guncel doviz kuru alinamadi. Lutfen daha sonra deneyin.');
        $days = RentalPeriod::days($period['pickup'], $period['dropoff']);
        $amount = number_format(ExchangeRates::convertUsd((float) $lead['dailyPrice'] * $days, 'TRY', $rates), 2, '.', '');
        if (VakifBank::minor($amount) <= 0) throw new DomainException('Odeme tutari gecersiz.');
        $q = [
            'leadId' => $lead['id'], 'vehicleId' => $lead['vehicleId'], 'title' => $lead['title'], 'userId' => $user['id'] ?? $lead['userId'],
            'pickupAt' => $period['pickup']->format('Y-m-d H:i:s'), 'dropoffAt' => $period['dropoff']->format('Y-m-d H:i:s'),
            'locationId' => $location['id'], 'location' => $location['name'], 'days' => $days,
            'dailyUsd' => (string) $lead['dailyPrice'], 'amount' => $amount, 'currency' => 'TRY', 'rates' => $rates,
            'expires' => time() + 300, 'nonce' => bin2hex(random_bytes(16)),
        ];
        $encoded = rtrim(strtr(base64_encode(json_encode($q, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)), '+/', '-_'), '=');
        return ['amount' => $amount, 'dailyUsd' => (string) $lead['dailyPrice'], 'currency' => 'TRY', 'days' => $days, 'location' => $location['name'],
            'expiresAt' => $q['expires'], 'quoteToken' => $encoded . '.' . hash_hmac('sha256', $encoded, (string) Config::get('app.secret'))];
    }

    public static function decodeQuote(string $token): array
    {
        if (strlen($token) > 12000 || substr_count($token, '.') !== 1) throw new DomainException('Fiyat onayi gecersiz.');
        [$body, $signature] = explode('.', $token, 2);
        if (!hash_equals(hash_hmac('sha256', $body, (string) Config::get('app.secret')), $signature)) throw new DomainException('Fiyat onayi dogrulanamadi.');
        $q = json_decode(base64_decode(strtr($body, '-_', '+/'), true) ?: '', true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($q) || ($q['expires'] ?? 0) <= time()) throw new DomainException('Fiyat onayinin suresi doldu. Tarihleri tekrar kontrol edin.');
        return $q;
    }

    public function prepare(array $q, array $input, ?array $user, array $sessionLeads, string $ip): array
    {
        $name = trim((string) ($input['contactName'] ?? ''));
        $email = strtolower(trim((string) ($input['contactEmail'] ?? '')));
        $phone = trim((string) ($input['contactPhone'] ?? ''));
        $address = trim((string) ($input['address'] ?? ''));
        $city = trim((string) ($input['city'] ?? ''));
        $zip = trim((string) ($input['zipCode'] ?? ''));
        if (mb_strlen($name) < 2 || mb_strlen($name) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190
            || !preg_match('/^\+?[0-9 ()-]{7,24}$/D', $phone) || mb_strlen($address) < 8 || mb_strlen($address) > 500
            || mb_strlen($city) < 2 || mb_strlen($city) > 100 || !preg_match('/^[A-Za-z0-9 -]{3,12}$/D', $zip) || !filter_var($ip, FILTER_VALIDATE_IP)) {
            throw new DomainException('Iletisim ve fatura adresi bilgilerini kontrol edin.');
        }
        $settings = VakifBank::settings();
        $this->pdo->beginTransaction();
        try {
            $vehicle = $this->pdo->prepare("SELECT stockCount, dailyPrice FROM Vehicle WHERE id = ? AND status = 'PUBLISHED' AND isPublishedWeb = 1 FOR UPDATE");
            $vehicle->execute([$q['vehicleId']]);
            $v = $vehicle->fetch(PDO::FETCH_ASSOC);
            if (!$v || (string) $v['dailyPrice'] !== $q['dailyUsd'] || strtotime($q['pickupAt']) < time() - 300) throw new DomainException('Arac fiyati veya tarih degisti. Yeni fiyat alin.');
            $lead = $this->pdo->prepare('SELECT id, userId FROM QuoteRequest WHERE id = ? FOR UPDATE');
            $lead->execute([$q['leadId']]);
            $owner = $lead->fetch(PDO::FETCH_ASSOC);
            if (!$owner || !self::owns($owner, $user, $sessionLeads)) throw new DomainException('Kiralama talebine erisim yok.');
            $branch = $this->pdo->prepare('SELECT id FROM BranchLocation WHERE id = ? AND isActive = 1');
            $branch->execute([$q['locationId']]);
            if (!$branch->fetchColumn()) throw new DomainException('Teslim noktasi artik aktif degil.');
            $read = $this->pdo->prepare('SELECT * FROM Reservation WHERE quoteRequestId = ? FOR UPDATE');
            $read->execute([$q['leadId']]);
            $r = $read->fetch(PDO::FETCH_ASSOC);
            if ($r && $r['status'] === 'CONFIRMED') throw new DomainException('Bu rezervasyon zaten onaylanmis.');
            if ($r && $r['paymentIntentId']) {
                $pending = $this->pdo->prepare("SELECT id FROM PaymentIntent WHERE id = ? AND status NOT IN ('FAILED','CANCELLED')");
                $pending->execute([$r['paymentIntentId']]);
                if ($pending->fetchColumn()) throw new DomainException('Bu rezervasyonun odemesi devam ediyor. Yeni odeme baslatmadan once sonucunu kontrol edin.');
            }
            $id = $r['id'] ?? Id::make('res_');
            if (!$this->capacity($q['vehicleId'], $id, $q['pickupAt'], $q['dropoffAt'], (int) $v['stockCount'])) throw new DomainException('Arac secilen tarihlerde dolu.');
            $paymentId = Id::make('pay_');
            $transactionId = bin2hex(random_bytes(16));
            $returnToken = bin2hex(random_bytes(32));
            $q += ['customerName' => $name, 'customerEmail' => $email, 'customerPhone' => $phone,
                'billing' => ['address' => $address, 'city' => $city, 'zipCode' => $zip]];
            $snapshot = json_encode($q, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            $this->pdo->prepare("INSERT INTO PaymentIntent (id, userId, quoteRequestId, provider, amount, currency, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'TRY', 'PENDING', NOW(3), NOW(3))")
                ->execute([$paymentId, $q['userId'], $q['leadId'], $settings['environment'] === 'test' ? 'vakifbank_test' : 'vakifbank', $q['amount']]);
            if ($r) {
                $this->pdo->prepare("UPDATE Reservation SET userId=?, paymentIntentId=?, status='HOLD', pickupAt=?, dropoffAt=?, pickupLocation=?, dropoffLocation=?, customerName=?, customerEmail=?, customerPhone=?, holdExpiresAt=DATE_ADD(NOW(3), INTERVAL 30 MINUTE), updatedAt=NOW(3) WHERE id=?")
                    ->execute([$q['userId'], $paymentId, $q['pickupAt'], $q['dropoffAt'], $q['location'], $q['location'], $name, $email, $phone, $id]);
            } else {
                $this->pdo->prepare("INSERT INTO Reservation (id, vehicleId, userId, quoteRequestId, paymentIntentId, status, pickupAt, dropoffAt, pickupLocation, dropoffLocation, customerName, customerEmail, customerPhone, holdExpiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'HOLD', ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL 30 MINUTE), NOW(3), NOW(3))")
                    ->execute([$id, $q['vehicleId'], $q['userId'], $q['leadId'], $paymentId, $q['pickupAt'], $q['dropoffAt'], $q['location'], $q['location'], $name, $email, $phone]);
            }
            $this->pdo->prepare("INSERT INTO PhpVposAttempt (paymentId, reservationId, transactionId, environment, merchantId, terminalNo, returnTokenHash, expiresAt, clientIp, snapshot) VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL 30 MINUTE), ?, ?)")
                ->execute([$paymentId, $id, $transactionId, $settings['environment'], $settings['merchant_id'], $settings['terminal_no'], hash('sha256', $returnToken), $ip, $snapshot]);
            foreach ([['PRIVACY_NOTICE_ACKNOWLEDGED', Privacy::NOTICE_VERSION], ['RENTAL_TERMS_ACCEPTED', Privacy::RENTAL_TERMS_VERSION], ['PRE_INFORMATION_ACCEPTED', Privacy::PRE_INFORMATION_VERSION], ['DISTANCE_SALES_ACCEPTED', Privacy::DISTANCE_SALES_VERSION]] as [$type, $version]) {
                Privacy::record($this->pdo, $q['userId'], $email, $type, $version);
            }
            $this->pdo->commit();
            return ['attempt' => $this->attempt($paymentId), 'returnToken' => $returnToken];
        } catch (Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }

    public function attempt(string $id): array
    {
        $read = $this->pdo->prepare('SELECT * FROM PhpVposAttempt WHERE paymentId = ?');
        $read->execute([$id]);
        $attempt = $read->fetch(PDO::FETCH_ASSOC);
        if (!$attempt) throw new DomainException('Odeme bulunamadi.');
        return $attempt;
    }

    public function challengeReady(string $id): void
    {
        $this->pdo->prepare("UPDATE PhpVposAttempt SET state='CHALLENGE', updatedAt=NOW(3) WHERE paymentId=? AND state='ENROLLING'")->execute([$id]);
    }

    public function claim(array $attempt, string $returnToken): bool
    {
        if (!preg_match('/^[a-f0-9]{64}$/D', $returnToken) || !hash_equals($attempt['returnTokenHash'], hash('sha256', $returnToken))) throw new DomainException('Banka donus dogrulamasi gecersiz.');
        $q = json_decode($attempt['snapshot'], true, 512, JSON_THROW_ON_ERROR);
        $this->pdo->beginTransaction();
        try {
            $vehicle = $this->pdo->prepare('SELECT stockCount FROM Vehicle WHERE id=? FOR UPDATE');
            $vehicle->execute([$q['vehicleId']]);
            $stock = (int) $vehicle->fetchColumn();
            $read = $this->pdo->prepare('SELECT * FROM Reservation WHERE id=? FOR UPDATE');
            $read->execute([$attempt['reservationId']]);
            $r = $read->fetch(PDO::FETCH_ASSOC);
            if (!$r || $r['paymentIntentId'] !== $attempt['paymentId'] || $r['status'] !== 'HOLD'
                || !$this->capacity($q['vehicleId'], $r['id'], $r['pickupAt'], $r['dropoffAt'], $stock)) {
                $this->pdo->commit(); return false;
            }
            $claim = $this->pdo->prepare("UPDATE PhpVposAttempt SET state='PROCESSING', consumedAt=NOW(3), updatedAt=NOW(3) WHERE paymentId=? AND state='CHALLENGE' AND consumedAt IS NULL AND expiresAt > NOW(3)");
            $claim->execute([$attempt['paymentId']]);
            $won = $claim->rowCount() === 1;
            if ($won) $this->pdo->prepare("UPDATE Reservation SET holdExpiresAt=DATE_ADD(NOW(3), INTERVAL 30 MINUTE), updatedAt=NOW(3) WHERE id=?")->execute([$r['id']]);
            $this->pdo->commit();
            return $won;
        } catch (Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }

    public function reconcile(array $attempt): void
    {
        if (!in_array($attempt['state'], ['PROCESSING', 'REVIEW'], true)) return;
        try {
            $result = VakifBank::search($attempt);
            if ($result !== null) { $this->settle($attempt, $result); return; }
        } catch (Throwable) {
            // Unknown is not a decline. Never issue another Sale to recover a timeout.
        }
        $this->pdo->prepare("UPDATE PhpVposAttempt SET state='REVIEW', resultCode='SEARCH_REQUIRED', updatedAt=NOW(3) WHERE paymentId=? AND state IN ('PROCESSING','REVIEW')")->execute([$attempt['paymentId']]);
        $this->pdo->prepare("UPDATE PaymentIntent p JOIN PhpVposAttempt a ON a.paymentId=p.id SET p.status='REVIEW_REQUIRED', p.updatedAt=NOW(3) WHERE p.id=? AND a.state='REVIEW' AND p.status IN ('PENDING','REVIEW_REQUIRED')")->execute([$attempt['paymentId']]);
    }

    public function settle(array $attempt, array $result): void
    {
        $q = json_decode($attempt['snapshot'], true, 512, JSON_THROW_ON_ERROR);
        $this->pdo->beginTransaction();
        try {
            $lock = $this->pdo->prepare('SELECT stockCount FROM Vehicle WHERE id = ? FOR UPDATE');
            $lock->execute([$q['vehicleId']]);
            $stock = (int) $lock->fetchColumn();
            $read = $this->pdo->prepare('SELECT * FROM Reservation WHERE id = ? FOR UPDATE');
            $read->execute([$attempt['reservationId']]);
            $r = $read->fetch(PDO::FETCH_ASSOC);
            $read = $this->pdo->prepare('SELECT state FROM PhpVposAttempt WHERE paymentId = ? FOR UPDATE');
            $read->execute([$attempt['paymentId']]);
            if (!in_array($read->fetchColumn(), ['PROCESSING', 'REVIEW'], true)) { $this->pdo->commit(); return; }
            if (!$r || $r['paymentIntentId'] !== $attempt['paymentId']) throw new DomainException('Rezervasyon odemeyle eslesmiyor.');
            $paid = $result['paid'] === true;
            if (!$paid) {
                $state = 'FAILED'; $paymentStatus = 'FAILED'; $reservationStatus = 'CANCELLED';
            } elseif ($attempt['environment'] === 'test') {
                $state = 'TEST_PAID'; $paymentStatus = 'CANCELLED'; $reservationStatus = 'CANCELLED';
            } elseif ($r['status'] === 'CANCELLED' || strtotime($r['pickupAt']) < time() - 300
                || !$this->capacity($q['vehicleId'], $r['id'], $r['pickupAt'], $r['dropoffAt'], $stock)) {
                $state = 'REVIEW_STOCK'; $paymentStatus = 'REVIEW_REQUIRED'; $reservationStatus = 'CANCELLED';
            } else {
                $state = 'PAID'; $paymentStatus = 'PAID'; $reservationStatus = 'CONFIRMED';
            }
            $this->pdo->prepare('UPDATE PhpVposAttempt SET state=?, resultCode=?, updatedAt=NOW(3) WHERE paymentId=?')->execute([$state, $result['code'], $attempt['paymentId']]);
            $this->pdo->prepare('UPDATE PaymentIntent SET status=?, providerRef=?, updatedAt=NOW(3) WHERE id=?')->execute([$paymentStatus, $attempt['transactionId'], $attempt['paymentId']]);
            $this->pdo->prepare('UPDATE Reservation SET status=?, holdExpiresAt=NULL, updatedAt=NOW(3) WHERE id=?')->execute([$reservationStatus, $r['id']]);
            if ($state === 'PAID') {
                $receipt = ReservationReceipt::snapshot(array_replace($r, ['status' => 'CONFIRMED', 'paymentStatus' => 'PAID', 'title' => $q['title'], 'amount' => $q['amount'], 'currency' => 'TRY']));
                $this->pdo->prepare("INSERT INTO PhpReservationMail (reservationId, paymentIntentId, recipient, snapshot) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reservationId=VALUES(reservationId)")
                    ->execute([$r['id'], $attempt['paymentId'], $r['customerEmail'], json_encode($receipt, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)]);
            }
            $this->pdo->commit();
        } catch (Throwable $error) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $error; }
    }

    public function failBeforeSale(string $id): void
    {
        $this->pdo->beginTransaction();
        try {
            $claim = $this->pdo->prepare("UPDATE PhpVposAttempt SET state='FAILED', resultCode='ENROLLMENT_FAILED', updatedAt=NOW(3) WHERE paymentId=? AND state IN ('ENROLLING','CHALLENGE')");
            $claim->execute([$id]);
            if ($claim->rowCount() === 1) {
                $this->pdo->prepare("UPDATE PaymentIntent SET status='FAILED', updatedAt=NOW(3) WHERE id=? AND status='PENDING'")->execute([$id]);
                $this->pdo->prepare("UPDATE Reservation SET status='CANCELLED', holdExpiresAt=NULL, updatedAt=NOW(3) WHERE paymentIntentId=? AND status='HOLD'")->execute([$id]);
            }
            $this->pdo->commit();
        } catch (Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }

    private function capacity(string $vehicle, string $exclude, string $pickup, string $dropoff, int $stock): bool
    {
        $count = $this->pdo->prepare("SELECT COUNT(*) FROM Reservation WHERE vehicleId=? AND id<>? AND pickupAt<? AND dropoffAt>? AND (status='CONFIRMED' OR (status='HOLD' AND holdExpiresAt>NOW(3)))");
        $count->execute([$vehicle, $exclude, $dropoff, $pickup]);
        return (int) $count->fetchColumn() < $stock;
    }
}
