<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Id;
use Kaptas\Core\Request;
use Kaptas\Core\Response;
use PDO;

final class Privacy
{
    public const NOTICE_VERSION = '2026-08-16-v1';
    public const RENTAL_TERMS_VERSION = '2026-08-17-v2';
    public const PRE_INFORMATION_VERSION = '2026-08-17-v1';
    public const DISTANCE_SALES_VERSION = '2026-08-17-v1';
    public const COMMERCIAL_CONSENT_VERSION = '2026-08-16-v1';

    public static function requireNotice(array $input): void
    {
        if (($input['privacyNoticeAccepted'] ?? false) !== true) {
            Response::json(['error' => 'KVKK Aydinlatma Metni okunup bilgilendirme beyanlanmalidir.'], 422);
        }
    }

    public static function requireRentalTerms(array $input): void
    {
        if (($input['termsAccepted'] ?? false) !== true) {
            Response::json(['error' => 'Kiralama kosullari ve on bilgilendirme kabul edilmelidir.'], 422);
        }
    }

    public static function requireDistanceSales(array $input): void
    {
        if (($input['distanceSalesAccepted'] ?? false) !== true) {
            Response::json(['error' => 'Mesafeli satis sozlesmesi ile teslimat ve iade sartlari kabul edilmelidir.'], 422);
        }
    }

    public static function requirePreInformation(array $input): void
    {
        if (($input['preInformationAccepted'] ?? false) !== true) {
            Response::json(['error' => 'On Bilgilendirme Formu okunup onaylanmalidir.'], 422);
        }
    }

    public static function record(
        PDO $pdo,
        ?string $userId,
        ?string $email,
        string $type,
        string $version,
    ): void {
        $statement = $pdo->prepare(
            'INSERT INTO ConsentRecord (id, userId, email, type, version, acceptedAt, ipAddress, userAgent) '
            . 'VALUES (?, ?, ?, ?, ?, NOW(3), ?, ?)'
        );
        $statement->execute([
            Id::make('consent_'),
            $userId,
            $email,
            $type,
            $version,
            Request::ip(),
            substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 191),
        ]);
    }
}
