<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Config;
use PDO;
use Throwable;

final class ReservationMailQueue
{
    public function __construct(private PDO $pdo) {}

    // Run outside the payment request: SMTP failure must never undo a payment.
    public function run(callable $send, int $limit = 20): array
    {
        $lockName = 'kaptas-mail-' . substr(hash('sha256', (string) $this->pdo->query('SELECT DATABASE()')->fetchColumn()), 0, 40);
        $lock = $this->pdo->prepare('SELECT GET_LOCK(?, 0)');
        $lock->execute([$lockName]);
        if ((int) $lock->fetchColumn() !== 1) return ['busy' => true];
        try {
            $enqueued = $this->discover();
            // A terminated worker can leave PROCESSING behind; the database lock excludes a live worker.
            $this->pdo->exec("UPDATE PhpReservationMail SET status = IF(attempts >= 5, 'FAILED', 'PENDING'), lastError = 'WORKER_INTERRUPTED', updatedAt = NOW(3) WHERE status = 'PROCESSING'");
            $limit = max(1, min(100, $limit));
            $jobs = $this->pdo->query("SELECT * FROM PhpReservationMail WHERE status = 'PENDING' AND nextAttemptAt <= NOW(3) ORDER BY nextAttemptAt, reservationId LIMIT {$limit}")->fetchAll(PDO::FETCH_ASSOC);
            $result = ['enqueued' => $enqueued, 'sent' => 0, 'retry' => 0, 'failed' => 0, 'cancelled' => 0];
            foreach ($jobs as $job) {
                $check = $this->pdo->prepare("SELECT r.id FROM Reservation r JOIN PaymentIntent p ON p.id = r.paymentIntentId WHERE r.id = ? AND p.id = ? AND r.status = 'CONFIRMED' AND p.status = 'PAID'");
                $check->execute([$job['reservationId'], $job['paymentIntentId']]);
                if (!$check->fetchColumn()) {
                    $this->pdo->prepare("UPDATE PhpReservationMail SET status = 'CANCELLED', updatedAt = NOW(3) WHERE reservationId = ?")->execute([$job['reservationId']]);
                    $result['cancelled']++;
                    continue;
                }
                $attempt = (int) $job['attempts'] + 1;
                $this->pdo->prepare("UPDATE PhpReservationMail SET status = 'PROCESSING', attempts = ?, updatedAt = NOW(3) WHERE reservationId = ?")->execute([$attempt, $job['reservationId']]);
                try {
                    $receipt = json_decode($job['snapshot'], true, 512, JSON_THROW_ON_ERROR);
                    $send($job['recipient'], 'KAPTAS - Rezervasyonunuz onaylandi - ' . $receipt['reference'],
                        ReservationReceipt::html($receipt, (string) Config::get('app.url')),
                        'reservation-confirmation-' . $job['reservationId']);
                } catch (Throwable $error) {
                    $status = $attempt >= 5 ? 'FAILED' : 'PENDING';
                    $delay = min(3600, 60 * (2 ** ($attempt - 1)));
                    $this->pdo->prepare("UPDATE PhpReservationMail SET status = ?, nextAttemptAt = DATE_ADD(NOW(3), INTERVAL {$delay} SECOND), lastError = 'DELIVERY_FAILED', updatedAt = NOW(3) WHERE reservationId = ?")
                        ->execute([$status, $job['reservationId']]);
                    // Never log the recipient, message, credentials or SMTP response.
                    error_log('Reservation mail delivery failed: ' . $job['reservationId'] . ' attempt=' . $attempt . ' type=' . get_class($error));
                    $result[$status === 'FAILED' ? 'failed' : 'retry']++;
                    continue;
                }
                $this->pdo->prepare("UPDATE PhpReservationMail SET status = 'SENT', sentAt = NOW(3), lastError = NULL, updatedAt = NOW(3) WHERE reservationId = ?")
                    ->execute([$job['reservationId']]);
                $result['sent']++;
            }
            return $result;
        } finally {
            $this->pdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
        }
    }

    private function discover(): int
    {
        // Activation cutoff prevents mailing imported historical bookings at installation.
        $rows = $this->pdo->query(
            "SELECT r.*, v.title, p.status AS paymentStatus, p.amount, p.currency FROM Reservation r "
            . "JOIN PaymentIntent p ON p.id = r.paymentIntentId JOIN Vehicle v ON v.id = r.vehicleId "
            . "JOIN PhpMailActivation a ON a.id = 1 LEFT JOIN PhpReservationMail q ON q.reservationId = r.id "
            . "WHERE r.status = 'CONFIRMED' AND p.status = 'PAID' AND q.reservationId IS NULL "
            . "AND GREATEST(r.updatedAt, p.updatedAt) >= a.activatedAt ORDER BY r.updatedAt LIMIT 100"
        )->fetchAll(PDO::FETCH_ASSOC);
        $insert = $this->pdo->prepare('INSERT INTO PhpReservationMail (reservationId, paymentIntentId, recipient, snapshot) VALUES (?, ?, ?, ?)');
        $count = 0;
        foreach ($rows as $row) {
            try {
                $snapshot = ReservationReceipt::snapshot($row);
            } catch (\InvalidArgumentException $error) {
                // Persist invalid records too, so they cannot block the next discovery batch.
                $this->pdo->prepare("INSERT INTO PhpReservationMail (reservationId, paymentIntentId, recipient, snapshot, status, lastError) VALUES (?, ?, ?, '{}', 'FAILED', 'INVALID_RECEIPT')")
                    ->execute([$row['id'], $row['paymentIntentId'], $row['customerEmail']]);
                continue;
            }
            $insert->execute([$row['id'], $row['paymentIntentId'], $row['customerEmail'], json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)]);
            $count++;
        }
        return $count;
    }
}
