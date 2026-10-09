<?php

declare(strict_types=1);

namespace Kaptas\Core;

use PDO;

final class RateLimiter
{
    public static function enforce(string $scope, int $limit, int $windowSeconds): void
    {
        $pdo = Database::connection();
        $key = hash('sha256', $scope . '|' . Request::ip());
        $now = time();
        $windowStart = $now - ($now % $windowSeconds);

        $pdo->prepare('DELETE FROM PhpRateLimit WHERE windowStart < ?')->execute([
            date('Y-m-d H:i:s', $now - 86400),
        ]);
        $statement = $pdo->prepare(
            'INSERT INTO PhpRateLimit (`key`, scope, hits, windowStart, updatedAt) VALUES (?, ?, 1, ?, NOW()) '
            . 'ON DUPLICATE KEY UPDATE hits = hits + 1, updatedAt = NOW()'
        );
        $statement->execute([$key, $scope, date('Y-m-d H:i:s', $windowStart)]);
        $read = $pdo->prepare('SELECT hits FROM PhpRateLimit WHERE `key` = ? AND scope = ? AND windowStart = ?');
        $read->execute([$key, $scope, date('Y-m-d H:i:s', $windowStart)]);
        $hits = (int) $read->fetchColumn();

        if ($hits > $limit) {
            $retryAfter = max(1, ($windowStart + $windowSeconds) - $now);
            Response::json(
                ['error' => 'Cok fazla istek gonderildi. Lutfen daha sonra tekrar deneyin.', 'retryAfter' => $retryAfter],
                429,
                ['Retry-After' => (string) $retryAfter],
            );
        }
    }
}
