<?php

declare(strict_types=1);

namespace Kaptas\Core;

final class Csrf
{
    public static function token(): string
    {
        if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verify(?string $token): bool
    {
        return is_string($token) && hash_equals(self::token(), $token);
    }

    public static function requireForMutation(): void
    {
        if (in_array(Request::method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrfToken'] ?? null);
        if (!self::verify(is_string($token) ? $token : null)) {
            Response::json(['error' => 'Guvenlik dogrulamasi basarisiz. Sayfayi yenileyip tekrar deneyin.'], 419);
        }
    }
}
