<?php
declare(strict_types=1);

namespace {
    if (PHP_SAPI !== 'cli') exit(1);
}

namespace Kaptas\Core {
    // Capture rejected HTTP responses without terminating the isolated test process.
    final class Response {
        public static function json(array $data, int $status = 200): never {
            throw new \RuntimeException((string) ($data['error'] ?? ''), $status);
        }
    }
}

namespace {
    require dirname(__DIR__) . '/app/Services/Privacy.php';
    $checks = 0;
    $guards = [
        'requireNotice' => 'privacyNoticeAccepted',
        'requireRentalTerms' => 'termsAccepted',
        'requirePreInformation' => 'preInformationAccepted',
        'requireDistanceSales' => 'distanceSalesAccepted',
    ];
    foreach ($guards as $method => $field) {
        if (!is_callable([\Kaptas\Services\Privacy::class, $method])) throw new \RuntimeException('Missing payment dependency: ' . $method);
        \Kaptas\Services\Privacy::$method([$field => true]);
        $checks++;
        foreach ([[], [$field => false], [$field => 'true'], [$field => 1], [$field => null]] as $input) {
            $rejected = false;
            try { \Kaptas\Services\Privacy::$method($input); }
            catch (\RuntimeException $error) { $rejected = $error->getCode() === 422 && $error->getMessage() !== ''; }
            if (!$rejected) throw new \RuntimeException('Consent bypass: ' . $method);
            $checks++;
        }
    }
    foreach (['NOTICE_VERSION', 'RENTAL_TERMS_VERSION', 'PRE_INFORMATION_VERSION', 'DISTANCE_SALES_VERSION'] as $constant) {
        if (!defined(\Kaptas\Services\Privacy::class . '::' . $constant)) throw new \RuntimeException('Missing receipt dependency: ' . $constant);
        $checks++;
    }
    echo 'OK: ' . $checks . " payment privacy checks; no DB, email or bank requests.\n";
}
