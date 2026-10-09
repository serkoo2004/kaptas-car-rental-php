ALTER TABLE `User`
  ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL;

ALTER TABLE `VerificationChallenge`
  MODIFY COLUMN `channel` ENUM('EMAIL', 'PHONE') NOT NULL;

ALTER TABLE `VerificationChallenge`
  ADD CONSTRAINT `VerificationChallenge_attempts_nonnegative` CHECK (`attempts` >= 0);
