CREATE TABLE IF NOT EXISTS `PhpMigration` (
    `version` VARCHAR(191) NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PhpRateLimit` (
    `key` CHAR(64) NOT NULL,
    `scope` VARCHAR(100) NOT NULL,
    `hits` INTEGER NOT NULL DEFAULT 0,
    `windowStart` DATETIME NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`key`, `scope`, `windowStart`),
    INDEX `PhpRateLimit_windowStart_idx` (`windowStart`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
