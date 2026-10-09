<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/app/bootstrap.php';
session_write_close();

use Kaptas\Core\Database;
use Kaptas\Services\RentalCheckout;
use Kaptas\Services\VakifBank;

$pdo = Database::connection();
$checkout = new RentalCheckout($pdo);
$settings = VakifBank::settings();
$lockName = 'kaptas-vpos-' . substr(hash('sha256', (string) $pdo->query('SELECT DATABASE()')->fetchColumn()), 0, 40);
$lock = $pdo->prepare('SELECT GET_LOCK(?, 0)');
$lock->execute([$lockName]);
if ((int) $lock->fetchColumn() !== 1) exit;
try {
    $expired = $pdo->query("SELECT paymentId FROM PhpVposAttempt WHERE state IN ('ENROLLING','CHALLENGE') AND expiresAt <= NOW(3) LIMIT 100")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($expired as $id) $checkout->failBeforeSale($id);
    $read = $pdo->prepare("SELECT * FROM PhpVposAttempt WHERE state IN ('PROCESSING','REVIEW') AND environment=? AND updatedAt < DATE_SUB(NOW(3), INTERVAL 2 MINUTE) AND createdAt > DATE_SUB(NOW(3), INTERVAL 7 DAY) ORDER BY updatedAt LIMIT 10");
    $read->execute([$settings['environment']]);
    $attempts = $read->fetchAll(PDO::FETCH_ASSOC);
    foreach ($attempts as $attempt) $checkout->reconcile($attempt);
    $review = (int) $pdo->query("SELECT COUNT(*) FROM PhpVposAttempt WHERE state IN ('REVIEW','REVIEW_STOCK')")->fetchColumn();
    echo json_encode(['checked' => count($attempts), 'expired' => count($expired), 'needsReview' => $review]) . PHP_EOL;
} finally { $pdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]); }
exit($review > 0 ? 1 : 0);
