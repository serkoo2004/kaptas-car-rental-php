<?php

declare(strict_types=1);

use Kaptas\Services\ExchangeRates;

require dirname(__DIR__) . '/app/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

try {
    $snapshot = ExchangeRates::snapshot(false);
    echo 'Kur guncellendi: ' . $snapshot['provider'] . ' / ' . $snapshot['asOf'] . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, 'Kur guncellenemedi: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
