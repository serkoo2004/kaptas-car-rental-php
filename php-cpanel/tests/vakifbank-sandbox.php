<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/app/bootstrap.php';
session_write_close();

use Kaptas\Services\VakifBank;

if (!in_array('--enrollment', $argv, true) || VakifBank::settings()['environment'] !== 'test') {
    fwrite(STDERR, "Yalnizca test ortami: VAKIFBANK_TEST_RETURN_URL ayarlayin ve --enrollment kullanin.\n");
    exit(1);
}
$return = getenv('VAKIFBANK_TEST_RETURN_URL') ?: '';
if (!filter_var($return, FILTER_VALIDATE_URL) || parse_url($return, PHP_URL_SCHEME) !== 'https') throw new RuntimeException('HTTPS test donus adresi gerekli.');
$settings = VakifBank::settings();
$attempt = ['environment' => 'test', 'merchantId' => $settings['merchant_id'], 'terminalNo' => $settings['terminal_no'],
    'transactionId' => bin2hex(random_bytes(16)), 'snapshot' => json_encode(['amount' => '1.09'])];
try {
    $challenge = VakifBank::enrollment($attempt, ['Pan' => '4938410109068353', 'ExpiryDate' => '2912'], $return);
    echo json_encode(['enrollment' => 'OK', 'bankAction' => $challenge['action'], 'saleRequested' => false]) . PHP_EOL;
} catch (Throwable $error) {
    // Do not expose PaReq, MD, callback tokens, card or credentials.
    fwrite(STDERR, 'Sandbox enrollment failed: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
