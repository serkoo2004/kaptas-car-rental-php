-- KAPTAŞ mevcut canlı kurulum: çoklu şube için yabancı dil alanları
-- Bu dosya yalnızca 001_mysql_initial.sql daha önce içe aktarılmış veritabanlarında bir kez çalıştırılır.

SET NAMES utf8mb4;

ALTER TABLE `BranchLocation`
    ADD COLUMN `nameEn` VARCHAR(191) NULL AFTER `name`,
    ADD COLUMN `nameAr` VARCHAR(191) NULL AFTER `nameEn`,
    ADD COLUMN `subtitleEn` VARCHAR(191) NULL AFTER `subtitle`,
    ADD COLUMN `subtitleAr` VARCHAR(191) NULL AFTER `subtitleEn`,
    ADD COLUMN `addressEn` TEXT NULL AFTER `address`,
    ADD COLUMN `addressAr` TEXT NULL AFTER `addressEn`;
