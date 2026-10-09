<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require dirname(__DIR__) . '/app/bootstrap.php';
if (session_status() === PHP_SESSION_ACTIVE) session_write_close();

use Kaptas\Core\Config;
use Kaptas\Services\Mailer;
use Kaptas\Services\ReservationReceipt;

$options = getopt('', ['to:', 'run:']);
$to = $options['to'] ?? null;
$run = $options['run'] ?? null;
if (!is_string($to) || strlen($to) > 190 || !filter_var($to, FILTER_VALIDATE_EMAIL)
    || preg_match('/[\r\n]/', $to) || !is_string($run) || !preg_match('/^[a-z0-9_-]{1,40}$/D', $run)) {
    fwrite(STDERR, "Usage: test-reservation-mail.php --to=EMAIL --run=UNIQUE_TEST_NAME\n");
    exit(1);
}
if (!Mailer::configured()) {
    fwrite(STDERR, "SMTP_NOT_CONFIGURED: no email sent.\n");
    exit(1);
}
$root = realpath(KAPTAS_ROOT . '/storage/logs');
if ($root === false || !is_writable($root)) {
    fwrite(STDERR, "TEST_STATE_DIRECTORY_UNAVAILABLE: no email sent.\n");
    exit(1);
}
$key = hash('sha256', strtolower($to) . '|' . $run);
$oldMask = umask(0077);
$lock = fopen($root . '/receipt-test-' . $key . '.state', 'c+');
umask($oldMask);
if ($lock === false) { fwrite(STDERR, "TEST_STATE_UNAVAILABLE: no email sent.\n"); exit(1); }
$exitCode = 0;
try {
    if (!flock($lock, LOCK_EX | LOCK_NB)) {
        echo "TEST_ALREADY_RUNNING: no additional email sent.\n";
    } elseif (trim((string) stream_get_contents($lock)) !== '') {
        echo "TEST_ALREADY_ATTEMPTED: no additional email sent. Check the mailbox and the first log result.\n";
    } else {
        $pickup = (new DateTimeImmutable('tomorrow', new DateTimeZone('Europe/Istanbul')))->setTime(9, 0);
        $receipt = [
            'reference' => 'TEST-' . strtoupper($run), 'customerName' => 'KAPTAS ekibi',
            'vehicleTitle' => 'Renault Duster Evolution Turbo TCe 145 hp',
            'pickupAt' => $pickup->format('d.m.Y H:i'), 'dropoffAt' => $pickup->modify('+3 days')->format('d.m.Y H:i'),
            'pickupLocation' => 'Trabzon Havalimani', 'dropoffLocation' => 'Trabzon Havalimani',
            'days' => 3, 'amount' => '3000.00', 'currency' => 'TRY', 'hasAccount' => false,
        ];
        // A named argument fails closed if the updated template was not uploaded.
        $html = ReservationReceipt::html($receipt, (string) Config::get('app.url'), test: true);
        // Claim before SMTP: an uncertain DATA response must not cause a repeat
        // cron invocation to send another message. No financial tables are read/written.
        $marker = 'ATTEMPTED ' . date(DATE_ATOM) . "\n";
        if (fwrite($lock, $marker) !== strlen($marker) || !fflush($lock)) {
            throw new RuntimeException('TEST_STATE_WRITE_FAILED');
        }
        (new Mailer())->send($to, '[TEST] KAPTAS - Rezervasyon e-postasi denemesi', $html, 'receipt-test-' . $key);
        echo json_encode(['test' => true, 'smtpAccepted' => true, 'paymentCreated' => false, 'reservationCreated' => false], JSON_THROW_ON_ERROR) . PHP_EOL;
    }
} catch (Throwable $error) {
    // SMTP errors can contain addresses or credentials; do not print raw traces.
    $smtpCode = null;
    if (preg_match('/^SMTP islemi reddedildi: ([45][0-9]{2})\b/', $error->getMessage(), $match)) $smtpCode = $match[1];
    echo json_encode(['test' => true, 'smtpAccepted' => false, 'error' => 'TEST_SEND_FAILED', 'smtpCode' => $smtpCode,
        'automaticRetry' => false, 'paymentCreated' => false, 'reservationCreated' => false], JSON_THROW_ON_ERROR) . PHP_EOL;
    $exitCode = 1;
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}
exit($exitCode);
