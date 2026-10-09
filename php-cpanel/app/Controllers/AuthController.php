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
use Kaptas\Core\Session;
use Kaptas\Services\Mailer;
use Kaptas\Services\Privacy;
use PDO;

final class AuthController
{
    public static function csrf(): never
    {
        Response::json(['csrfToken' => Csrf::token()]);
    }

    public static function session(): never
    {
        $user = Auth::user();
        Response::json(['user' => $user ? [
            'email' => $user['email'],
            'id' => $user['id'],
            'name' => $user['name'],
            'role' => $user['role'],
            'status' => $user['status'],
        ] : null]);
    }

    public static function login(): never
    {
        RateLimiter::enforce('login', 15, 900);
        $input = Request::input();
        if (!Csrf::verify(isset($input['csrfToken']) ? (string) $input['csrfToken'] : null)) {
            Response::json(['url' => '/?error=CSRF'], 403);
        }
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8 || strlen($password) > 128) {
            Response::json(['url' => '/?error=CredentialsSignin'], 401);
        }

        $pdo = Database::connection();
        $statement = $pdo->prepare('SELECT id, passwordHash, role, status, failedLoginCount, lockedUntil FROM User WHERE email = ? LIMIT 1');
        $statement->execute([$email]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);
        $locked = $user && $user['lockedUntil'] && strtotime((string) $user['lockedUntil']) > time();
        $valid = $user && $user['passwordHash'] && $user['status'] === 'ACTIVE' && !$locked
            && password_verify($password, (string) $user['passwordHash']);

        if (!$valid) {
            if ($user && !$locked) {
                $failed = (int) $user['failedLoginCount'] + 1;
                $update = $pdo->prepare('UPDATE User SET failedLoginCount = ?, lockedUntil = ?, updatedAt = NOW(3) WHERE id = ?');
                $update->execute([$failed, $failed >= 5 ? date('Y-m-d H:i:s', time() + 900) : null, $user['id']]);
            }
            usleep(random_int(150000, 350000));
            Response::json(['url' => '/?error=CredentialsSignin'], 401);
        }

        if (password_needs_rehash((string) $user['passwordHash'], PASSWORD_DEFAULT)) {
            $pdo->prepare('UPDATE User SET passwordHash = ? WHERE id = ?')->execute([
                password_hash($password, PASSWORD_DEFAULT), $user['id'],
            ]);
        }
        $pdo->prepare('UPDATE User SET failedLoginCount = 0, lockedUntil = NULL, lastLoginAt = NOW(3), updatedAt = NOW(3) WHERE id = ?')
            ->execute([$user['id']]);
        Auth::login((string) $user['id']);
        $callback = str_starts_with((string) ($input['callbackUrl'] ?? ''), '/') ? (string) $input['callbackUrl'] : '/';
        Response::json(['url' => $callback]);
    }

    public static function logout(): never
    {
        Csrf::requireForMutation();
        Session::destroy();
        Response::json(['url' => '/']);
    }

    public static function register(): never
    {
        RateLimiter::enforce('register', 5, 3600);
        $input = Request::json();
        $name = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        Privacy::requireNotice($input);

        if (mb_strlen($name) < 2 || mb_strlen($name) > 120
            || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190
            || !self::validNewPassword($password)) {
            Response::json(['error' => 'Bilgileri kontrol edip tekrar deneyin.'], 422);
        }

        $pdo = Database::connection();
        $check = $pdo->prepare('SELECT id FROM User WHERE email = ? LIMIT 1');
        $check->execute([$email]);
        if ($check->fetchColumn()) {
            Response::json(['error' => 'Bu e-posta adresiyle kayitli bir hesap var.'], 409);
        }

        try {
            Database::transaction(static function (PDO $pdo) use ($name, $email, $password, $input): void {
                $userId = Id::make('user_');
                $pdo->prepare(
                    "INSERT INTO User (id, name, email, passwordHash, role, status, failedLoginCount, createdAt, updatedAt) "
                    . "VALUES (?, ?, ?, ?, 'USER', 'ACTIVE', 0, NOW(3), NOW(3))"
                )->execute([$userId, $name, $email, password_hash($password, PASSWORD_DEFAULT)]);
                Privacy::record(
                    $pdo, $userId, $email, 'PRIVACY_NOTICE_ACKNOWLEDGED', Privacy::NOTICE_VERSION
                );
                if (($input['commercialConsent'] ?? false) === true) {
                    Privacy::record(
                        $pdo, $userId, $email, 'COMMERCIAL_COMMUNICATION_CONSENT', Privacy::COMMERCIAL_CONSENT_VERSION
                    );
                }
            });
        } catch (\PDOException $error) {
            if ((string) $error->getCode() === '23000') {
                Response::json(['error' => 'Bu e-posta adresiyle kayitli bir hesap var.'], 409);
            }
            throw $error;
        }
        Response::json(['ok' => true], 201);
    }

    public static function requestPasswordReset(): never
    {
        Csrf::requireForMutation();
        RateLimiter::enforce('password-reset-request', 5, 3600);
        $input = Request::json();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
            Response::json(['error' => 'Gecerli bir e-posta adresi girin.'], 422);
        }
        if (!Mailer::configured()) {
            Response::json(['error' => 'E-posta servisi henuz yapilandirilmamis.'], 503);
        }
        $pdo = Database::connection();
        $statement = $pdo->prepare("SELECT id FROM User WHERE email = ? AND status = 'ACTIVE' LIMIT 1");
        $statement->execute([$email]);
        $userId = $statement->fetchColumn();
        if ($userId) {
            $pdo->prepare('DELETE FROM VerificationToken WHERE identifier = ? OR expires < NOW(3)')->execute([$email]);
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $token = hash_hmac('sha256', $email . '|' . $code, (string) \Kaptas\Core\Config::get('app.secret'));
            $pdo->prepare('INSERT INTO VerificationToken (identifier, token, expires) VALUES (?, ?, DATE_ADD(NOW(3), INTERVAL 10 MINUTE))')
                ->execute([$email, $token]);
            try {
                Mailer::passwordReset($email, $code);
            } catch (\Throwable $error) {
                $pdo->prepare('DELETE FROM VerificationToken WHERE token = ?')->execute([$token]);
                error_log($error->__toString());
                Response::json(['error' => 'Sifre yenileme e-postasi gonderilemedi.'], 502);
            }
        } else {
            usleep(random_int(150000, 350000));
        }
        Response::json(['ok' => true, 'message' => 'Hesap kayitliysa yenileme kodu e-posta adresine gonderildi.']);
    }

    public static function confirmPasswordReset(): never
    {
        Csrf::requireForMutation();
        RateLimiter::enforce('password-reset-confirm', 10, 900);
        $input = Request::json();
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $code = trim((string) ($input['code'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[0-9]{6}$/', $code)
            || !self::validNewPassword($password)) {
            Response::json(['error' => 'Kod veya yeni sifre gecersiz.'], 422);
        }
        $token = hash_hmac('sha256', $email . '|' . $code, (string) \Kaptas\Core\Config::get('app.secret'));
        try {
            $changed = Database::transaction(static function (PDO $pdo) use ($email, $token, $password): bool {
                $claim = $pdo->prepare('SELECT token FROM VerificationToken WHERE identifier = ? AND token = ? AND expires > NOW(3) FOR UPDATE');
                $claim->execute([$email, $token]);
                if (!$claim->fetchColumn()) return false;
                $update = $pdo->prepare("UPDATE User SET passwordHash = ?, failedLoginCount = 0, lockedUntil = NULL, updatedAt = NOW(3) WHERE email = ? AND status = 'ACTIVE'");
                $update->execute([password_hash($password, PASSWORD_DEFAULT), $email]);
                $pdo->prepare('DELETE FROM VerificationToken WHERE identifier = ?')->execute([$email]);
                return $update->rowCount() === 1;
            });
        } catch (\Throwable) {
            Response::json(['error' => 'Sifre yenilenemedi. Lutfen tekrar deneyin.'], 500);
        }
        if (!$changed) Response::json(['error' => 'Kod hatali veya suresi dolmus.'], 422);
        Session::destroy();
        Response::json(['ok' => true]);
    }

    private static function validNewPassword(string $password): bool
    {
        return strlen($password) >= 10 && strlen($password) <= 128
            && preg_match('/[a-z]/', $password) === 1
            && preg_match('/[A-Z]/', $password) === 1
            && preg_match('/[0-9]/', $password) === 1
            && preg_match('/[^A-Za-z0-9]/', $password) === 1;
    }
}
