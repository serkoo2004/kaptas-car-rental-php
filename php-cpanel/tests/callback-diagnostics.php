<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);

require dirname(__DIR__) . '/app/Controllers/PaymentController.php';

$method = new ReflectionMethod(Kaptas\Controllers\PaymentController::class, 'callbackDiagnosticCode');
$complete = array_fill_keys(['VerifyEnrollmentRequestId', 'MerchantId', 'PurchCurrency', 'PurchAmount', 'Eci', 'Cavv', 'MdStatus', 'Status', 'Hash'], 'private-test-value');
$checks = 0;
$missing = ['VerifyEnrollmentRequestId' => 'CB_MISSING_REQUEST_ID', 'MerchantId' => 'CB_MISSING_MERCHANT', 'PurchCurrency' => 'CB_MISSING_CURRENCY', 'PurchAmount' => 'CB_MISSING_AMOUNT', 'Eci' => 'CB_MISSING_ECI', 'Cavv' => 'CB_MISSING_CAVV', 'MdStatus' => 'CB_MISSING_MDSTATUS', 'Status' => 'CB_MISSING_STATUS', 'Hash' => 'CB_MISSING_HASH'];
foreach ($missing as $field => $expected) {
    $input = $complete;
    unset($input[$field]);
    $actual = $method->invoke(null, new DomainException('Banka cevabi eksik.'), $input, 'CB_VERIFY_ERROR');
    if ($actual !== $expected) throw new RuntimeException('Missing-field diagnostic mismatch');
    $checks++;
}
foreach ([
    'Banka cevabi gecersiz.' => 'CB_INVALID_FIELDS',
    'Tekrarlanan banka alani.' => 'CB_DUPLICATE_FIELD',
    'Tutar gecersiz.' => 'CB_AMOUNT_FORMAT',
    'Banka islem bilgileri eslesmiyor.' => 'CB_PAYMENT_MISMATCH',
    'Banka islem numarasi eslesmiyor.' => 'CB_TRANSACTION_MISMATCH',
    'Banka isyeri bilgisi eslesmiyor.' => 'CB_MERCHANT_MISMATCH',
    'Banka para birimi eslesmiyor.' => 'CB_CURRENCY_MISMATCH',
    'Banka tutari eslesmiyor.' => 'CB_AMOUNT_MISMATCH',
    'Banka donus tutarinin bicimi gecersiz.' => 'CB_AMOUNT_FORMAT',
    'Banka imzasi dogrulanamadi.' => 'CB_SIGNATURE_INVALID',
    'Untrusted error containing private-test-value' => 'CB_VERIFY_ERROR',
] as $message => $expected) {
    $actual = $method->invoke(null, new DomainException($message), $complete, 'CB_VERIFY_ERROR');
    if ($actual !== $expected || strlen($actual) > 32 || str_contains($actual, 'private')) throw new RuntimeException('Unsafe diagnostic');
    $checks++;
}
echo 'OK: ' . $checks . " callback diagnostic checks; no bank, DB, or mail requests.\n";
