<?php

declare(strict_types=1);

use Kaptas\Controllers\AccountController;
use Kaptas\Controllers\AdminController;
use Kaptas\Controllers\AuthController;
use Kaptas\Controllers\PaymentController;
use Kaptas\Controllers\PublicController;
use Kaptas\Core\Request;
use Kaptas\Core\Response;

require dirname(__DIR__, 2) . '/app/bootstrap.php';

$method = Request::method();
$path = Request::path();

if ($method !== 'GET' || preg_match('#^/api/(?:auth|account|admin|payments)(?:/|$)#', $path)) {
    header('Cache-Control: no-store, max-age=0');
    header('Pragma: no-cache');
}

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method === 'GET' && preg_match('#^/api/media/vehicles/([^/]+)/([^/]+)$#', $path, $match)) {
    PublicController::media($match[1], $match[2]);
}

$routes = [
    'GET /api/health' => static fn () => Response::json([
        'ok' => true,
        'database' => (bool) \Kaptas\Core\Database::connection()->query('SELECT 1')->fetchColumn(),
        ...(!\Kaptas\Core\Config::isProduction() ? ['php' => PHP_VERSION] : []),
    ]),
    'GET /api/auth/csrf' => [AuthController::class, 'csrf'],
    'GET /api/auth/session' => [AuthController::class, 'session'],
    'POST /api/auth/callback/credentials' => [AuthController::class, 'login'],
    'POST /api/auth/signout' => [AuthController::class, 'logout'],
    'POST /api/public/register' => [AuthController::class, 'register'],
    'POST /api/auth/password/request' => [AuthController::class, 'requestPasswordReset'],
    'POST /api/auth/password/confirm' => [AuthController::class, 'confirmPasswordReset'],
    'GET /api/account' => [AccountController::class, 'show'],
    'PATCH /api/account' => [AccountController::class, 'update'],
    'POST /api/account/verifications/request' => [AccountController::class, 'requestVerification'],
    'POST /api/account/verifications/confirm' => [AccountController::class, 'confirmVerification'],
    'GET /api/public/vehicles' => [PublicController::class, 'vehicles'],
    'GET /api/public/locations' => [PublicController::class, 'locations'],
    'GET /api/public/exchange-rates' => [PublicController::class, 'exchangeRates'],
    'POST /api/public/contact' => [PublicController::class, 'contact'],
    'POST /api/public/rental-intents' => [PublicController::class, 'rentalIntent'],
    'POST /api/payments/start' => [PaymentController::class, 'start'],
    'POST /api/payments/quote' => [PaymentController::class, 'quote'],
    'GET /api/payments/status' => [PaymentController::class, 'status'],
    'POST /api/payments/vakifbank/callback' => [PaymentController::class, 'callback'],
    'GET /api/admin/bootstrap' => [AdminController::class, 'bootstrap'],
    'GET /api/admin/dashboard' => [AdminController::class, 'dashboard'],
    'GET /api/admin/vehicles' => [AdminController::class, 'vehicles'],
    'POST /api/admin/vehicles' => [AdminController::class, 'createVehicle'],
    'PATCH /api/admin/vehicles' => [AdminController::class, 'updateVehicle'],
    'DELETE /api/admin/vehicles' => [AdminController::class, 'deleteVehicle'],
    'POST /api/admin/vehicle-images' => [AdminController::class, 'uploadVehicleImage'],
    'PATCH /api/admin/vehicle-images' => [AdminController::class, 'updateVehicleImage'],
    'DELETE /api/admin/vehicle-images' => [AdminController::class, 'deleteVehicleImage'],
    'GET /api/admin/reservations' => [AdminController::class, 'reservations'],
    'PATCH /api/admin/reservations' => [AdminController::class, 'updateReservation'],
    'GET /api/admin/leads' => [AdminController::class, 'leads'],
    'PATCH /api/admin/leads' => [AdminController::class, 'updateLead'],
    'GET /api/admin/locations' => [AdminController::class, 'locations'],
    'POST /api/admin/locations' => [AdminController::class, 'saveLocation'],
    'GET /api/admin/users' => [AdminController::class, 'users'],
    'PATCH /api/admin/users' => [AdminController::class, 'updateUser'],
    'GET /api/admin/documents' => [AdminController::class, 'documents'],
    'PATCH /api/admin/documents' => [AdminController::class, 'updateDocument'],
];

$handler = $routes[$method . ' ' . $path] ?? null;
if (!$handler) {
    Response::json(['error' => 'API adresi bulunamadi.'], 404);
}
$handler();
