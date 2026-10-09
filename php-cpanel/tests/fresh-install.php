<?php

declare(strict_types=1);

use Kaptas\Core\Config;
require dirname(__DIR__) . '/app/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$databaseName = 'kaptas_php_install_test_' . date('YmdHis');
$host = (string) Config::get('database.host');
$port = (int) Config::get('database.port', 3306);
$user = getenv('TEST_DB_ADMIN_USER') ?: (string) Config::get('database.user');
$password = getenv('TEST_DB_ADMIN_PASSWORD') ?: (string) Config::get('database.password');
$server = new \PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $password, [
    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
]);

try {
    $server->exec("CREATE DATABASE `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $test = new \PDO("mysql:host={$host};port={$port};dbname={$databaseName};charset=utf8mb4", $user, $password, [
        \PDO::ATTR_EMULATE_PREPARES => true,
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
    ]);
    $installPath = dirname(__DIR__) . '/deploy/latest-install.sql';
    if (!is_file($installPath)) {
        $parts = [];
        $files = glob(dirname(__DIR__) . '/database/migrations/*.sql') ?: [];
        sort($files, SORT_NATURAL);
        foreach ($files as $file) $parts[] = (string) file_get_contents($file);
        $data = dirname(__DIR__) . '/database/current-data.sql';
        if (is_file($data)) $parts[] = (string) file_get_contents($data);
        $sql = implode("\n\n", $parts);
    } else {
        $sql = (string) file_get_contents($installPath);
    }
    $test->exec($sql);

    $tables = (int) $test->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchColumn();
    $vehicles = (int) $test->query('SELECT COUNT(*) FROM Vehicle')->fetchColumn();
    $admins = (int) $test->query("SELECT COUNT(*) FROM User WHERE role IN ('ADMIN','SUPER_ADMIN') AND status = 'ACTIVE'")->fetchColumn();
    $images = (int) $test->query('SELECT COUNT(*) FROM VehicleImage')->fetchColumn();
    $locations = (int) $test->query('SELECT COUNT(*) FROM BranchLocation WHERE isActive = 1')->fetchColumn();

    if ($tables < 44 || $vehicles < 3 || $admins < 1 || $images < 3 || $locations !== 1) {
        throw new RuntimeException("Kurulum dogrulamasi basarisiz: tables={$tables}, vehicles={$vehicles}, admins={$admins}, images={$images}, locations={$locations}");
    }
    echo "Fresh install OK: tables={$tables}, vehicles={$vehicles}, admins={$admins}, images={$images}, locations={$locations}\n";
} finally {
    $server->exec("DROP DATABASE IF EXISTS `{$databaseName}`");
}
