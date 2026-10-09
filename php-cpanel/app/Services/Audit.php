<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Database;
use Kaptas\Core\Id;
use Kaptas\Core\Request;

final class Audit
{
    public static function record(?string $actorId, string $action, string $entityType, ?string $entityId, mixed $before, mixed $after): void
    {
        $statement = Database::connection()->prepare(
            'INSERT INTO AuditLog (id, actorId, action, entityType, entityId, `before`, `after`, ipAddress, userAgent, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))'
        );
        $statement->execute([
            Id::make('audit_'), $actorId, $action, $entityType, $entityId,
            $before === null ? null : json_encode($before, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            $after === null ? null : json_encode($after, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            Request::ip(), substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 191),
        ]);
    }
}
