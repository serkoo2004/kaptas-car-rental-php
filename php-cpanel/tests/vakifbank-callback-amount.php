<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/app/Core/Config.php';
require dirname(__DIR__) . '/app/Services/VakifBank.php';

use Kaptas\Services\VakifBank;

// No bootstrap or private config: settings() falls back to public sandbox data.
// No database, card number, bank request, Sale, session or email is involved.
$checks = 0;
function verifyCallback(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException($message);
    $checks++;
}
function rejectCallback(callable $fn, string $message): void {
    try { $fn(); } catch (DomainException) { verifyCallback(true, $message); return; }
    throw new RuntimeException($message);
}
$attempt = ['environment' => 'test', 'merchantId' => '000100000013506', 'terminalNo' => 'VP000579',
    'transactionId' => 'amount-regression', 'snapshot' => json_encode(['amount' => '12536.21'], JSON_THROW_ON_ERROR)];
$fields = ['VerifyEnrollmentRequestId' => 'amount-regression', 'MerchantId' => '000100000013506',
    'PurchCurrency' => '949', 'PurchAmount' => '1253621', 'Eci' => '05', 'Cavv' => 'fixture', 'MdStatus' => '1', 'Status' => 'Y'];
$sign = static function (array $input, string $minor): array {
    // Independent expected minor amount, not the function being tested.
    $text = $input['VerifyEnrollmentRequestId'] . $input['MerchantId'] . $input['PurchCurrency'] . $minor
        . str_pad($input['Eci'], 2, '0', STR_PAD_LEFT) . $input['Cavv'] . $input['MdStatus'] . $input['Status'] . '123456';
    $input['Hash'] = base64_encode(hash('sha256', iconv('UTF-8', 'ISO-8859-9', $text), true));
    return $input;
};
foreach (['1253621', '12536.21'] as $format) {
    $signed = $sign(array_replace($fields, ['PurchAmount' => $format]), '1253621');
    verifyCallback(VakifBank::verifiedCallback($signed, $attempt)['authenticated'], 'Both documented formats map to the same amount');
}
foreach ([['1.09', '109'], ['80.00', '8000'], ['0.01', '1'], ['999999999.99', '99999999999']] as [$major, $minor]) {
    $testAttempt = array_replace($attempt, ['snapshot' => json_encode(['amount' => $major], JSON_THROW_ON_ERROR)]);
    $signed = $sign(array_replace($fields, ['PurchAmount' => $minor]), $minor);
    verifyCallback(VakifBank::verifiedCallback($signed, $testAttempt)['authenticated'], 'Integer callback interpreted as minor units');
    verifyCallback(VakifBank::minor($major) === (int) $minor, 'Other operations keep decimal amount semantics');
}
foreach (['125362100', '12536', '1253620'] as $wrong) {
    rejectCallback(fn () => VakifBank::verifiedCallback($sign(array_replace($fields, ['PurchAmount' => $wrong]), $wrong), $attempt), 'Even a signed wrong amount is rejected');
}
foreach (['1e6', '+1253621', '-1253621', '12,536.21', '12536,21', '12536.210', '12536.2', ' 1253621', '1253621 ', "1253621\n", '', '01253621', '100000000000', 'NaN'] as $invalid) {
    rejectCallback(fn () => VakifBank::verifiedCallback($sign(array_replace($fields, ['PurchAmount' => $invalid]), '1253621'), $attempt), 'Invalid amount format rejected');
}
$signed = $sign($fields, '1253621');
foreach (['Hash' => 'bad', 'VerifyEnrollmentRequestId' => 'other', 'MerchantId' => 'other', 'PurchCurrency' => '840'] as $key => $value) {
    rejectCallback(fn () => VakifBank::verifiedCallback(array_replace($signed, [$key => $value]), $attempt), 'Security field remains enforced: ' . $key);
}
verifyCallback(!VakifBank::verifiedCallback($sign(array_replace($fields, ['Status' => 'N']), '1253621'), $attempt)['authenticated'], 'Signed 3D failure cannot authorize Sale');
echo "OK: {$checks} callback amount checks; no bank, DB, private config or mail access.\n";
