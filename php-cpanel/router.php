<?php

declare(strict_types=1);

$public = __DIR__ . '/public_html';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = realpath($public . $path);

if ($file && str_starts_with($file, realpath($public)) && is_file($file)) {
    return false;
}

if (str_starts_with($path, '/api/')) {
    require $public . '/api/index.php';
    return true;
}
if (str_starts_with($path, '/admin')) {
    require $public . '/admin/index.php';
    return true;
}
if (str_starts_with($path, '/satin-al')) {
    require $public . '/checkout/index.php';
    return true;
}
if (rtrim($path, '/') === '/forgot-password') {
    require $public . '/password-reset/index.php';
    return true;
}

$allowed = ['/', '/arac-filosu', '/hakkimizda', '/iletisim', '/kiralama-kosullari'];
if (in_array(rtrim($path, '/') ?: '/', $allowed, true)) {
    readfile($public . '/index.html');
    return true;
}
http_response_code(404);
echo 'Sayfa bulunamadi.';
