<?php

declare(strict_types=1);

namespace Kaptas\Core;

final class Request
{
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        return '/' . trim(rawurldecode($path), '/');
    }

    public static function json(int $maxBytes = 1_048_576): array
    {
        $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($length > $maxBytes) {
            Response::json(['error' => 'Istek boyutu izin verilen siniri asiyor.'], 413);
        }
        $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
        if ($raw === false || strlen($raw) > $maxBytes) {
            Response::json(['error' => 'Istek okunamadi.'], 400);
        }
        if ($raw === '') {
            return [];
        }
        try {
            $decoded = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            Response::json(['error' => 'Gecersiz JSON verisi.'], 400);
        }
        return is_array($decoded) ? $decoded : [];
    }

    public static function input(): array
    {
        $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
        return str_contains($contentType, 'application/json') ? self::json() : $_POST;
    }

    public static function ip(): string
    {
        return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
    }
}
