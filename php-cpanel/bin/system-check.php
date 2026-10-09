<?php

declare(strict_types=1);

use Kaptas\Core\Config;
use Kaptas\Core\Database;

require dirname(__DIR__) . '/app/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$requirements = [
    'PHP >= 8.2' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL' => extension_loaded('pdo_mysql'),
    'cURL' => extension_loaded('curl'),
    'OpenSSL' => extension_loaded('openssl'),
    'mbstring' => extension_loaded('mbstring'),
    'fileinfo' => extension_loaded('fileinfo'),
    'SimpleXML' => extension_loaded('simplexml'),
    'JSON' => extension_loaded('json'),
    'Session' => extension_loaded('session'),
    'Storage cache yazilabilir' => is_writable(KAPTAS_ROOT . '/storage/cache'),
    'Storage log yazilabilir' => is_writable(KAPTAS_ROOT . '/storage/logs'),
    'Yeni gorsel klasoru yazilabilir' => is_writable(KAPTAS_ROOT . '/public_html/uploads/vehicles'),
    'APP_SECRET ayarli' => strlen((string) Config::get('app.secret')) >= 32,
    'HTTPS uygulama URL adresi' => str_starts_with((string) Config::get('app.url'), 'https://'),
];

try {
    $requirements['MySQL baglantisi'] = (bool) Database::connection()->query('SELECT 1')->fetchColumn();
    $requirements['Veritabani semasi'] = (int) Database::connection()->query(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('User','Vehicle','Reservation','PaymentIntent','PhpRateLimit')"
    )->fetchColumn() === 5;
} catch (Throwable $error) {
    $requirements['MySQL baglantisi'] = false;
    $requirements['Veritabani semasi'] = false;
    fwrite(STDERR, 'MySQL: ' . $error->getMessage() . PHP_EOL);
}

$requirements['SMTP e-posta'] = Config::get('mail.host', '') !== '' && Config::get('mail.password', '') !== '';
$requirements['VakifBank odeme ayarlari'] = \Kaptas\Services\VakifBank::available(['role' => 'ADMIN']);

$failed = false;
foreach ($requirements as $label => $ok) {
    $required = !in_array($label, ['SMTP e-posta', 'VakifBank odeme ayarlari'], true);
    $state = $ok ? 'OK' : ($required ? 'HATA' : 'KAPALI');
    echo str_pad($state, 7) . $label . PHP_EOL;
    if ($required && !$ok) $failed = true;
}
exit($failed ? 1 : 0);
