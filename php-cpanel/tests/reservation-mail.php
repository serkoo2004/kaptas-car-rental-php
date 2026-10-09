<?php

declare(strict_types=1);

// Session-local temporary tables shadow real tables; never sends external email.
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/app/bootstrap.php';
session_write_close();

use Kaptas\Core\Config;
use Kaptas\Services\Mailer;
use Kaptas\Services\ReservationMailQueue;
use Kaptas\Services\ReservationReceipt;

$checks = 0;
function check(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException($message);
    $checks++;
}
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];
$dsn = 'mysql:host=' . Config::get('database.host') . ';port=' . Config::get('database.port', 3306) . ';charset=utf8mb4';
$user = getenv('TEST_DB_ADMIN_USER') ?: Config::get('database.user');
$password = getenv('TEST_DB_ADMIN_PASSWORD') ?: Config::get('database.password');
$database = (string) Config::get('database.name');
if (!in_array((string) Config::get('database.host'), ['localhost', '127.0.0.1', '::1'], true) || Config::isProduction()) {
    throw new RuntimeException('Bu test yalnizca yerel gelistirme ortaminda calistirilabilir.');
}
try {
    $pdo = new PDO($dsn . ';dbname=' . $database, $user, $password, $options);
    $pdo->exec("SET time_zone = '+03:00'");
    $pdo->exec('CREATE TEMPORARY TABLE Vehicle (id VARCHAR(191) PRIMARY KEY, title VARCHAR(255) NOT NULL) ENGINE=InnoDB');
    $pdo->exec('CREATE TEMPORARY TABLE PaymentIntent (id VARCHAR(191) PRIMARY KEY, status VARCHAR(30), amount DECIMAL(12,2), currency VARCHAR(3), updatedAt DATETIME(3)) ENGINE=InnoDB');
    $pdo->exec('CREATE TEMPORARY TABLE Reservation (id VARCHAR(191) PRIMARY KEY, vehicleId VARCHAR(191), paymentIntentId VARCHAR(191), userId VARCHAR(191), status VARCHAR(30), pickupAt DATETIME(3), dropoffAt DATETIME(3), pickupLocation VARCHAR(255), dropoffLocation VARCHAR(255), customerName VARCHAR(255), customerEmail VARCHAR(254), updatedAt DATETIME(3)) ENGINE=InnoDB');
    $migration = file_get_contents(dirname(__DIR__) . '/database/migrations/007_reservation_mail.sql');
    $migration = str_replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMPORARY TABLE IF NOT EXISTS', $migration);
    $pdo->exec($migration);
    $activation = $pdo->query('SELECT activatedAt FROM PhpMailActivation')->fetchColumn();
    $pdo->exec($migration);
    check($activation === $pdo->query('SELECT activatedAt FROM PhpMailActivation')->fetchColumn(), 'Migration must preserve activation cutoff');
    $pdo->exec("INSERT INTO Vehicle VALUES ('car', 'Renault Duster <script>alert(1)</script>')");
    $fixture = static function (string $id, string $reservation = 'CONFIRMED', string $payment = 'PAID', bool $historical = false) use ($pdo): void {
        $stamp = $historical ? '2020-01-01 00:00:00' : date('Y-m-d H:i:s', time() + 1);
        $pdo->prepare('INSERT INTO PaymentIntent VALUES (?, ?, 250.50, ?, ?)')->execute(['pay_' . $id, $payment, 'TRY', $stamp]);
        $pdo->prepare("INSERT INTO Reservation VALUES (?, 'car', ?, 'user', ?, '2026-11-01 09:00:00', '2026-11-03 10:00:00', 'Airport <b>Desk</b>', 'Office', 'Customer <img>', 'customer@example.test', ?)")
            ->execute([$id, 'pay_' . $id, $reservation, $stamp]);
    };
    $fixture('confirmed');
    $fixture('pending', 'HOLD', 'PENDING');
    $fixture('failed', 'HOLD', 'FAILED');
    $fixture('review', 'CONFIRMED', 'REVIEW_REQUIRED');
    $fixture('unpaid', 'CONFIRMED', 'PENDING');
    $fixture('paid_hold', 'HOLD', 'PAID');
    $fixture('cancelled', 'CANCELLED', 'PAID');
    $fixture('historical', 'CONFIRMED', 'PAID', true);
    $queue = new ReservationMailQueue($pdo);
    $sent = [];
    $capture = static function (...$args) use (&$sent): void { $sent[] = $args; };
    $result = $queue->run($capture);
    check($result['sent'] === 1 && count($sent) === 1, 'Only confirmed and paid new booking is sent');
    check(str_contains($sent[0][1], 'CONFIRMED'), 'Subject includes full reservation reference');
    check(str_contains($sent[0][2], '250,50 TRY'), 'Actual paid total included');
    check(str_contains($sent[0][2], '01.11.2026 09:00') && str_contains($sent[0][2], '03.11.2026 10:00'), 'Dates included');
    check(str_contains($sent[0][2], '&lt;script&gt;') && !str_contains($sent[0][2], '<script>'), 'Vehicle title escaped');
    check(str_contains($sent[0][2], '&lt;img&gt;') && str_contains($sent[0][2], '&lt;b&gt;'), 'Name and location escaped');
    check(str_contains($sent[0][2], '/?account=rentals'), 'Account link included');
    $snapshot = json_decode($pdo->query("SELECT snapshot FROM PhpReservationMail WHERE reservationId = 'confirmed'")->fetchColumn(), true);
    check($snapshot['days'] === 3, 'Partial day rounds up');
    $guest = ReservationReceipt::html(array_replace($snapshot, ['hasAccount' => false]), 'https://example.test');
    check(!str_contains($guest, '?account=rentals') && str_contains($guest, 'Misafir'), 'Guest receipt does not promise account history');
    $mime = new ReflectionMethod(Mailer::class, 'mimeBody');
    $body = $mime->invoke(null, $sent[0][2], 'test-boundary');
    check(str_contains($body, 'Content-ID: <kaptas-logo>') && str_contains($body, 'text/plain'), 'Embedded logo and plain text alternative included');
    $result = $queue->run($capture);
    check($result['sent'] === 0 && count($sent) === 1, 'Repeated worker does not resend');

    $fixture('retry');
    $result = $queue->run(static function (): void { throw new RuntimeException('Simulated SMTP failure'); });
    check($result['retry'] === 1, 'SMTP failure schedules retry');
    check($pdo->query("SELECT status FROM PaymentIntent WHERE id = 'pay_retry'")->fetchColumn() === 'PAID', 'SMTP error cannot alter payment');
    check($pdo->query("SELECT status FROM Reservation WHERE id = 'retry'")->fetchColumn() === 'CONFIRMED', 'SMTP error cannot alter reservation');
    $pdo->exec("UPDATE Vehicle SET title = 'Changed after payment'; UPDATE PaymentIntent SET amount = 999 WHERE id = 'pay_retry'");
    $pdo->exec("UPDATE PhpReservationMail SET nextAttemptAt = NOW(3) WHERE reservationId = 'retry'");
    $queue->run($capture);
    check(str_contains($sent[1][2], '250,50 TRY') && !str_contains($sent[1][2], 'Changed after payment'), 'Retry keeps queued snapshot');
    check($sent[1][3] === 'reservation-confirmation-retry', 'Stable message key');

    $fixture('cancel_before_send');
    $queue->run(static function (): void { throw new RuntimeException('Simulated SMTP failure'); });
    $pdo->exec("UPDATE Reservation SET status = 'CANCELLED' WHERE id = 'cancel_before_send'; UPDATE PhpReservationMail SET nextAttemptAt = NOW(3) WHERE reservationId = 'cancel_before_send'");
    $result = $queue->run($capture);
    check($result['cancelled'] === 1, 'Cancelled booking is not sent on retry');

    $fixture('exhaust');
    for ($i = 0; $i < 5; $i++) {
        $pdo->exec("UPDATE PhpReservationMail SET nextAttemptAt = NOW(3) WHERE reservationId = 'exhaust'");
        $queue->run(static function (): void { throw new RuntimeException('Simulated SMTP failure'); });
    }
    check($pdo->query("SELECT status FROM PhpReservationMail WHERE reservationId = 'exhaust'")->fetchColumn() === 'FAILED', 'Retries stop after five failures');
    check((int) $pdo->query("SELECT attempts FROM PhpReservationMail WHERE reservationId = 'exhaust'")->fetchColumn() === 5, 'Five attempts persisted');

    $fixture('interrupted');
    $queue->run($capture, 0);
    $pdo->exec("UPDATE PhpReservationMail SET status = 'PROCESSING', attempts = 1 WHERE reservationId = 'interrupted'");
    $result = $queue->run($capture);
    check($result['sent'] === 1, 'Interrupted worker is recovered');

    $other = new PDO($dsn . ';dbname=' . $database, $user, $password, $options);
    $lockName = 'kaptas-mail-' . substr(hash('sha256', $database), 0, 40);
    $stmt = $other->prepare('SELECT GET_LOCK(?, 0)');
    $stmt->execute([$lockName]);
    check(($queue->run($capture)['busy'] ?? false) === true, 'Concurrent worker excluded');
    $other->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
    $other = null;

    $row = $pdo->query("SELECT r.*, v.title, p.status AS paymentStatus, p.amount, p.currency FROM Reservation r JOIN Vehicle v ON v.id = r.vehicleId JOIN PaymentIntent p ON p.id = r.paymentIntentId WHERE r.id = 'pending'")->fetch();
    try {
        ReservationReceipt::snapshot($row);
        check(false, 'Pending receipt must be rejected');
    } catch (InvalidArgumentException) { check(true, 'Pending receipt rejected'); }
    echo "OK: {$checks} reservation-mail checks; no external email sent.\n";
} finally {
    $pdo = null;
}
