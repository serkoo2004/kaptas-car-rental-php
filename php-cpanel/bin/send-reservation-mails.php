<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/app/bootstrap.php';
session_write_close();

use Kaptas\Core\Database;
use Kaptas\Services\Mailer;
use Kaptas\Services\ReservationMailQueue;

$pdo = Database::connection();
if (in_array('--status', $argv, true)) {
    echo json_encode($pdo->query('SELECT status, COUNT(*) AS total FROM PhpReservationMail GROUP BY status')->fetchAll(), JSON_PRETTY_PRINT) . PHP_EOL;
    exit;
}
if (!Mailer::configured()) {
    fwrite(STDERR, "SMTP yapilandirilmamis; hicbir e-posta gonderilmedi.\n");
    exit(1);
}
$result = (new ReservationMailQueue($pdo))->run([new Mailer(), 'send']);
echo json_encode($result, JSON_THROW_ON_ERROR) . PHP_EOL;
exit(($result['failed'] ?? 0) > 0 || ($result['retry'] ?? 0) > 0 ? 1 : 0);
