<?php

declare(strict_types=1);

use Kaptas\Core\Config;
use Kaptas\Core\Response;
use Kaptas\Core\Session;

const KAPTAS_ROOT = __DIR__ . '/..';

spl_autoload_register(static function (string $class): void {
    $prefix = 'Kaptas\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $path = __DIR__ . DIRECTORY_SEPARATOR . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

spl_autoload_register(static function (string $class): void {
    $prefix = 'Iyzipay\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix)));
    $path = KAPTAS_ROOT . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'iyzipay-php'
        . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'Iyzipay' . DIRECTORY_SEPARATOR . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

Config::load(KAPTAS_ROOT);

date_default_timezone_set('Europe/Istanbul');
ini_set('display_errors', Config::isProduction() ? '0' : '1');
ini_set('log_errors', '1');
// Payment arguments can contain transient PAN/API credentials. Exclude them from traces.
ini_set('zend.exception_ignore_args', '1');
ini_set('error_log', KAPTAS_ROOT . '/storage/logs/php-error.log');

set_exception_handler(static function (Throwable $error): never {
    error_log($error->__toString());
    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, $error->getMessage() . PHP_EOL);
        exit(1);
    }
    Response::json([
        'error' => 'Beklenmeyen bir sunucu hatasi olustu.',
        ...(!Config::isProduction() ? ['detail' => $error->getMessage()] : []),
    ], 500);
});

if (Config::isProduction() && strlen((string) Config::get('app.secret')) < 32) {
    throw new RuntimeException('APP_SECRET en az 32 karakter olmalidir.');
}

header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: frame-ancestors 'self'");
$bankCallback = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    && rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/') === '/api/payments/vakifbank/callback';
if (!$bankCallback) Session::start();
