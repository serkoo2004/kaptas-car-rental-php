<?php

declare(strict_types=1);

namespace Kaptas\Services;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use Kaptas\Core\Database;
use Kaptas\Core\Id;
use PDO;
use RuntimeException;

final class RentalPeriod
{
    public static function parse(string $pickupDate, string $pickupTime, string $dropoffDate, string $dropoffTime): array
    {
        if (!self::validDate($pickupDate) || !self::validTime($pickupTime)
            || !self::validDate($dropoffDate) || !self::validTime($dropoffTime)) {
            throw new InvalidArgumentException('Kiralama tarih ve saat bilgileri gecersiz.');
        }
        $zone = new DateTimeZone('Europe/Istanbul');
        $pickup = new DateTimeImmutable($pickupDate . ' ' . $pickupTime, $zone);
        $dropoff = new DateTimeImmutable($dropoffDate . ' ' . $dropoffTime, $zone);
        $now = new DateTimeImmutable('now', $zone);
        if ($pickup->getTimestamp() < $now->getTimestamp() - 300) {
            throw new InvalidArgumentException('Alis zamani gecmiste olamaz.');
        }
        if ($dropoff <= $pickup) {
            throw new InvalidArgumentException('Birakis zamani alis zamanindan sonra olmalidir.');
        }
        if ($dropoff->getTimestamp() - $pickup->getTimestamp() > 90 * 86400) {
            throw new InvalidArgumentException('Kiralama suresi 90 gunu asamaz.');
        }
        return ['pickup' => $pickup, 'dropoff' => $dropoff];
    }

    public static function availability(array $vehicleIds, DateTimeImmutable $pickup, DateTimeImmutable $dropoff): array
    {
        if ($vehicleIds === []) {
            return [];
        }
        $pdo = Database::connection();
        $pdo->exec("UPDATE Reservation SET status = 'EXPIRED', updatedAt = NOW(3) WHERE status = 'HOLD' AND holdExpiresAt <= NOW(3)");
        $marks = implode(',', array_fill(0, count($vehicleIds), '?'));
        $statement = $pdo->prepare(
            "SELECT vehicleId, COUNT(*) AS reserved FROM Reservation WHERE vehicleId IN ({$marks}) "
            . "AND pickupAt < ? AND dropoffAt > ? AND (status = 'CONFIRMED' OR (status = 'HOLD' AND holdExpiresAt > NOW(3))) GROUP BY vehicleId"
        );
        $statement->execute([...$vehicleIds, self::sql($dropoff), self::sql($pickup)]);
        $reserved = [];
        foreach ($statement->fetchAll() as $row) {
            $reserved[$row['vehicleId']] = (int) $row['reserved'];
        }
        return $reserved;
    }

    public static function hold(array $data): string
    {
        return Database::transaction(static function (PDO $pdo) use ($data): string {
            $lock = $pdo->prepare("SELECT stockCount FROM Vehicle WHERE id = ? AND status = 'PUBLISHED' AND isPublishedWeb = 1 FOR UPDATE");
            $lock->execute([$data['vehicleId']]);
            $stock = $lock->fetchColumn();
            if ($stock === false || (int) $stock <= 0) {
                throw new RuntimeException('Secilen arac kiralamaya uygun degil.');
            }
            $pdo->prepare("UPDATE Reservation SET status = 'EXPIRED', updatedAt = NOW(3) WHERE vehicleId = ? AND status = 'HOLD' AND holdExpiresAt <= NOW(3)")
                ->execute([$data['vehicleId']]);
            $count = $pdo->prepare(
                "SELECT COUNT(*) FROM Reservation WHERE vehicleId = ? AND pickupAt < ? AND dropoffAt > ? "
                . "AND (status = 'CONFIRMED' OR (status = 'HOLD' AND holdExpiresAt > NOW(3)))"
            );
            $count->execute([$data['vehicleId'], self::sql($data['dropoff']), self::sql($data['pickup'])]);
            if ((int) $count->fetchColumn() >= (int) $stock) {
                throw new RuntimeException('Secilen arac bu tarih araliginda musait degil.');
            }
            $id = Id::make('res_');
            $insert = $pdo->prepare(
                "INSERT INTO Reservation (id, vehicleId, userId, quoteRequestId, status, pickupAt, dropoffAt, pickupLocation, dropoffLocation, holdExpiresAt, customerName, customerEmail, customerPhone, createdAt, updatedAt) "
                . "VALUES (?, ?, ?, ?, 'HOLD', ?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL 15 MINUTE), ?, ?, ?, NOW(3), NOW(3))"
            );
            $insert->execute([
                $id, $data['vehicleId'], $data['userId'], $data['quoteRequestId'],
                self::sql($data['pickup']), self::sql($data['dropoff']), $data['pickupLocation'], $data['dropoffLocation'],
                $data['customerName'], $data['customerEmail'], $data['customerPhone'],
            ]);
            return $id;
        });
    }

    public static function days(DateTimeImmutable $pickup, DateTimeImmutable $dropoff): int
    {
        return max(1, (int) ceil(($dropoff->getTimestamp() - $pickup->getTimestamp()) / 86400));
    }

    private static function sql(DateTimeImmutable $date): string
    {
        return $date->format('Y-m-d H:i:s.v');
    }

    private static function validDate(string $value): bool
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return $date !== false && $date->format('Y-m-d') === $value;
    }

    private static function validTime(string $value): bool
    {
        return preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value) === 1;
    }
}
