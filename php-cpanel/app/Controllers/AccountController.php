<?php

declare(strict_types=1);

namespace Kaptas\Controllers;

use Kaptas\Core\Auth;
use Kaptas\Core\Csrf;
use Kaptas\Core\Database;
use Kaptas\Core\Id;
use Kaptas\Core\RateLimiter;
use Kaptas\Core\Request;
use Kaptas\Core\Response;
use Kaptas\Services\Mailer;
use Kaptas\Services\RentalPeriod;
use Kaptas\Services\ReservationReceipt;
use PDO;

final class AccountController
{
    public static function show(): never
    {
        $auth = Auth::requireUser();
        $pdo = Database::connection();
        $pdo->exec("UPDATE Reservation SET status = 'EXPIRED', updatedAt = NOW(3) WHERE status = 'HOLD' AND holdExpiresAt <= NOW(3)");
        $userStatement = $pdo->prepare('SELECT id, name, email, emailVerified, phone, address, city, district, createdAt FROM User WHERE id = ?');
        $userStatement->execute([$auth['id']]);
        $user = $userStatement->fetch(PDO::FETCH_ASSOC);
        $rentalsStatement = $pdo->prepare(
            'SELECT r.*, v.title, b.name AS brand, m.name AS model, pi.amount, pi.currency, pi.provider, pi.providerRef, pi.status AS paymentStatus, '
            . '(SELECT url FROM VehicleImage WHERE vehicleId = v.id ORDER BY isCover DESC, sortOrder ASC LIMIT 1) AS coverImage '
            . 'FROM Reservation r JOIN Vehicle v ON v.id = r.vehicleId JOIN VehicleBrand b ON b.id = v.brandId '
            . 'JOIN VehicleModel m ON m.id = v.modelId LEFT JOIN PaymentIntent pi ON pi.id = r.paymentIntentId '
            . 'WHERE r.userId = ? ORDER BY r.pickupAt DESC LIMIT 50'
        );
        $rentalsStatement->execute([$auth['id']]);
        $rentals = array_map(static fn (array $row): array => [
            'cancellationNote' => $row['cancellationNote'],
            'createdAt' => self::iso($row['createdAt']),
            'dropoffAt' => self::iso($row['dropoffAt']),
            'dropoffLocation' => $row['dropoffLocation'],
            'holdExpiresAt' => $row['holdExpiresAt'] ? self::iso($row['holdExpiresAt']) : null,
            'id' => $row['id'],
            'reference' => ReservationReceipt::reference($row['id']),
            'rentalDays' => RentalPeriod::days(new \DateTimeImmutable($row['pickupAt']), new \DateTimeImmutable($row['dropoffAt'])),
            'payment' => $row['paymentStatus'] ? [
                'amount' => (float) $row['amount'], 'currency' => $row['currency'], 'provider' => $row['provider'],
                'providerRef' => $row['providerRef'], 'status' => $row['paymentStatus'],
            ] : null,
            'pickupAt' => self::iso($row['pickupAt']),
            'pickupLocation' => $row['pickupLocation'],
            'status' => $row['status'],
            'vehicle' => [
                'brand' => $row['brand'], 'coverImage' => $row['coverImage'], 'model' => $row['model'], 'title' => $row['title'],
            ],
        ], $rentalsStatement->fetchAll());

        Response::json([
            'rentals' => $rentals,
            'user' => self::frontUser($user),
            'verificationServices' => ['email' => Mailer::configured()],
        ]);
    }

    public static function update(): never
    {
        Csrf::requireForMutation();
        $auth = Auth::requireUser();
        $input = Request::json();
        $name = trim((string) ($input['name'] ?? ''));
        $address = trim((string) ($input['address'] ?? ''));
        $city = trim((string) ($input['city'] ?? ''));
        $district = trim((string) ($input['district'] ?? ''));
        $phone = self::normalizePhone((string) ($input['phone'] ?? ''));
        if (mb_strlen($name) < 2 || mb_strlen($name) > 120 || mb_strlen($address) > 500
            || mb_strlen($city) > 100 || mb_strlen($district) > 100 || $phone === false) {
            Response::json(['error' => 'Bilgileri kontrol edip tekrar deneyin.'], 422);
        }
        try {
            $statement = Database::connection()->prepare(
                'UPDATE User SET name = ?, address = NULLIF(?, \'\'), city = NULLIF(?, \'\'), district = NULLIF(?, \'\'), phone = ?, phoneVerifiedAt = NULL, updatedAt = NOW(3) WHERE id = ?'
            );
            $statement->execute([$name, $address, $city, $district, $phone ?: null, $auth['id']]);
        } catch (\PDOException $error) {
            if ((string) $error->getCode() === '23000') {
                Response::json(['error' => 'Bu telefon numarasi baska bir hesapta kullaniliyor.'], 409);
            }
            throw $error;
        }
        $read = Database::connection()->prepare('SELECT id, name, email, emailVerified, phone, address, city, district, createdAt FROM User WHERE id = ?');
        $read->execute([$auth['id']]);
        Response::json(['ok' => true, 'user' => self::frontUser($read->fetch())]);
    }

    public static function requestVerification(): never
    {
        Csrf::requireForMutation();
        RateLimiter::enforce('email-verification', 8, 3600);
        $auth = Auth::requireUser();
        $input = Request::json();
        $target = strtolower(trim((string) ($input['target'] ?? '')));
        if (($input['channel'] ?? '') !== 'EMAIL' || !filter_var($target, FILTER_VALIDATE_EMAIL) || strlen($target) > 190) {
            Response::json(['error' => 'Gecerli bir e-posta adresi girin.'], 422);
        }
        if (!Mailer::configured()) {
            Response::json(['error' => 'E-posta gonderimi henuz yapilandirilmamis.'], 503);
        }
        $pdo = Database::connection();
        $used = $pdo->prepare('SELECT id FROM User WHERE email = ? AND id <> ? LIMIT 1');
        $used->execute([$target, $auth['id']]);
        if ($used->fetchColumn()) {
            Response::json(['error' => 'Bu e-posta baska bir hesapta kullaniliyor.'], 409);
        }
        $recent = $pdo->prepare('SELECT createdAt FROM VerificationChallenge WHERE channel = \'EMAIL\' AND (userId = ? OR target = ?) AND createdAt > DATE_SUB(NOW(3), INTERVAL 60 SECOND) ORDER BY createdAt DESC LIMIT 1');
        $recent->execute([$auth['id'], $target]);
        if ($recent->fetchColumn()) {
            Response::json(['error' => 'Yeni kod icin 60 saniye bekleyin.', 'retryAfter' => 60], 429, ['Retry-After' => '60']);
        }
        $id = Id::uuid();
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $secret = (string) \Kaptas\Core\Config::get('app.secret');
        $hash = hash_hmac('sha256', $id . '|' . $code . '|' . $auth['id'], $secret);
        $pdo->prepare(
            "INSERT INTO VerificationChallenge (id, userId, channel, target, codeHash, attempts, expiresAt, createdAt) VALUES (?, ?, 'EMAIL', ?, ?, 0, DATE_ADD(NOW(3), INTERVAL 10 MINUTE), NOW(3))"
        )->execute([$id, $auth['id'], $target, $hash]);
        try {
            Mailer::verification($target, $code);
        } catch (\Throwable $error) {
            $pdo->prepare('DELETE FROM VerificationChallenge WHERE id = ?')->execute([$id]);
            error_log($error->__toString());
            Response::json(['error' => 'Dogrulama e-postasi gonderilemedi.'], 502);
        }
        $pdo->prepare("UPDATE VerificationChallenge SET consumedAt = NOW(3) WHERE userId = ? AND channel = 'EMAIL' AND id <> ? AND consumedAt IS NULL")
            ->execute([$auth['id'], $id]);
        Response::json(['challengeId' => $id, 'expiresInSeconds' => 600, 'maskedTarget' => self::maskEmail($target), 'ok' => true]);
    }

    public static function confirmVerification(): never
    {
        Csrf::requireForMutation();
        $auth = Auth::requireUser();
        $input = Request::json();
        $id = (string) ($input['challengeId'] ?? '');
        $code = (string) ($input['code'] ?? '');
        if (!preg_match('/^[0-9]{6}$/', $code)) {
            Response::json(['error' => 'Alti haneli dogrulama kodunu girin.'], 422);
        }
        $pdo = Database::connection();
        $statement = $pdo->prepare('SELECT * FROM VerificationChallenge WHERE id = ? AND userId = ? LIMIT 1');
        $statement->execute([$id, $auth['id']]);
        $challenge = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$challenge || $challenge['channel'] !== 'EMAIL' || $challenge['consumedAt']
            || strtotime((string) $challenge['expiresAt']) <= time() || (int) $challenge['attempts'] >= 5) {
            Response::json(['error' => 'Dogrulama kodunun suresi dolmus veya kod artik gecersiz.'], 410);
        }
        $hash = hash_hmac('sha256', $id . '|' . $code . '|' . $auth['id'], (string) \Kaptas\Core\Config::get('app.secret'));
        if (!hash_equals((string) $challenge['codeHash'], $hash)) {
            $pdo->prepare('UPDATE VerificationChallenge SET attempts = attempts + 1, consumedAt = IF(attempts + 1 >= 5, NOW(3), consumedAt) WHERE id = ?')->execute([$id]);
            $remaining = max(0, 4 - (int) $challenge['attempts']);
            Response::json(['attemptsRemaining' => $remaining, 'error' => 'Dogrulama kodu hatali.'], 422);
        }
        try {
            $updated = Database::transaction(static function (PDO $pdo) use ($challenge, $auth, $id): array {
                $claim = $pdo->prepare('UPDATE VerificationChallenge SET consumedAt = NOW(3) WHERE id = ? AND consumedAt IS NULL AND expiresAt > NOW(3) AND attempts < 5');
                $claim->execute([$id]);
                if ($claim->rowCount() !== 1) {
                    throw new \RuntimeException('Kod daha once kullanilmis.');
                }
                $pdo->prepare('UPDATE User SET email = ?, emailVerified = NOW(3), updatedAt = NOW(3) WHERE id = ?')->execute([$challenge['target'], $auth['id']]);
                return ['email' => $challenge['target'], 'emailVerified' => date(DATE_ATOM)];
            });
        } catch (\PDOException $error) {
            if ((string) $error->getCode() === '23000') {
                Response::json(['error' => 'Bu e-posta baska bir hesapta kullaniliyor.'], 409);
            }
            throw $error;
        }
        Response::json(['channel' => 'EMAIL', 'ok' => true, 'user' => $updated]);
    }

    private static function frontUser(array $user): array
    {
        return [
            'address' => $user['address'] ?? '', 'city' => $user['city'] ?? '', 'createdAt' => self::iso($user['createdAt']),
            'district' => $user['district'] ?? '', 'email' => $user['email'],
            'emailVerified' => $user['emailVerified'] ? self::iso($user['emailVerified']) : null,
            'id' => $user['id'], 'name' => $user['name'] ?? '', 'phone' => $user['phone'] ?? '',
        ];
    }

    private static function normalizePhone(string $value): string|false
    {
        if (trim($value) === '') {
            return '';
        }
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if (str_starts_with($digits, '90') && strlen($digits) === 12) $digits = substr($digits, 2);
        if (strlen($digits) === 11 && $digits[0] === '0') $digits = substr($digits, 1);
        return preg_match('/^5\d{9}$/', $digits) ? '+90' . $digits : false;
    }

    private static function maskEmail(string $email): string
    {
        [$name, $domain] = explode('@', $email, 2);
        return substr($name, 0, min(2, strlen($name))) . str_repeat('*', max(2, strlen($name) - 2)) . '@' . $domain;
    }

    private static function iso(string $value): string
    {
        return (new \DateTimeImmutable($value, new \DateTimeZone('Europe/Istanbul')))->format(DATE_ATOM);
    }
}
