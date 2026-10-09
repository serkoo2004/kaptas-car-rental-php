<?php

declare(strict_types=1);

namespace Kaptas\Core;

use PDO;

final class Auth
{
    private static ?array $cachedUser = null;
    private static bool $resolved = false;

    public static function user(): ?array
    {
        if (self::$resolved) {
            return self::$cachedUser;
        }
        self::$resolved = true;
        $id = $_SESSION['user_id'] ?? null;
        if (!is_string($id) || $id === '') {
            return null;
        }
        $statement = Database::connection()->prepare(
            'SELECT id, name, email, role, status FROM User WHERE id = ? LIMIT 1'
        );
        $statement->execute([$id]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$user || $user['status'] !== 'ACTIVE') {
            unset($_SESSION['user_id']);
            return null;
        }
        return self::$cachedUser = $user;
    }

    public static function login(string $userId): void
    {
        Session::regenerate();
        $_SESSION['user_id'] = $userId;
        self::$resolved = false;
        self::$cachedUser = null;
    }

    public static function requireUser(): array
    {
        $user = self::user();
        if (!$user) {
            Response::json(['error' => 'Oturum acmaniz gerekiyor.'], 401);
        }
        return $user;
    }

    public static function requireAdmin(): array
    {
        $user = self::requireUser();
        if (!in_array($user['role'], ['ADMIN', 'SUPER_ADMIN'], true)) {
            Response::json(['error' => 'Bu islem icin yetkiniz yok.'], 403);
        }
        return $user;
    }
}
