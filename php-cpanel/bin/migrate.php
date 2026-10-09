<?php

declare(strict_types=1);

use Kaptas\Core\Database;

require dirname(__DIR__) . '/app/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$pdo = Database::connection();
$pdo->exec("CREATE TABLE IF NOT EXISTS PhpMigration (version VARCHAR(191) PRIMARY KEY, appliedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$adoptExisting = in_array('--adopt-existing', $argv ?? [], true);
if ($adoptExisting) {
    $existingUserTable = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'User'")->fetchColumn();
    if ((int) $existingUserTable === 1) {
        $adopt = $pdo->prepare('INSERT IGNORE INTO PhpMigration (version) VALUES (?)');
        foreach (['001_mysql_initial', '002_daily_rental_pricing', '003_contact_verification', '004_vehicle_drive_type', '005_single_daily_price'] as $version) {
            $adopt->execute([$version]);
        }
        echo "Mevcut MySQL semasi korundu ve ilk bes migrasyon sahiplenildi.\n";
    }
}
$applied = array_flip($pdo->query('SELECT version FROM PhpMigration')->fetchAll(PDO::FETCH_COLUMN));
$files = glob(dirname(__DIR__) . '/database/migrations/*.sql') ?: [];
sort($files, SORT_NATURAL);

foreach ($files as $file) {
    $version = basename($file, '.sql');
    if (isset($applied[$version])) {
        echo "Atlandi: {$version}\n";
        continue;
    }
    $sql = (string) file_get_contents($file);
    try {
        $pdo->exec($sql);
        $statement = $pdo->prepare('INSERT INTO PhpMigration (version) VALUES (?)');
        $statement->execute([$version]);
        echo "Uygulandi: {$version}\n";
    } catch (Throwable $error) {
        fwrite(STDERR, "Hata: {$version}: {$error->getMessage()}\n");
        exit(1);
    }
}
