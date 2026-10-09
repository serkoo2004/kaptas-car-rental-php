<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Id;
use RuntimeException;

final class Upload
{
    private const MAX_SIZE = 10_485_760;
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public static function vehicle(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Gorsel yuklenemedi.');
        }
        if ((int) ($file['size'] ?? 0) <= 0 || (int) $file['size'] > self::MAX_SIZE) {
            throw new RuntimeException('Gorsel en fazla 10 MB olabilir.');
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file((string) $file['tmp_name']);
        if (!isset(self::TYPES[$mime])) {
            throw new RuntimeException('Yalnizca JPEG, PNG veya WebP gorsel yuklenebilir.');
        }
        $name = Id::make('vehicle_') . '.' . self::TYPES[$mime];
        $target = KAPTAS_ROOT . '/public_html/uploads/vehicles/' . $name;
        if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
            throw new RuntimeException('Gorsel kaydedilemedi.');
        }
        return ['path' => $target, 'url' => '/uploads/vehicles/' . $name, 'mime' => $mime];
    }
}
