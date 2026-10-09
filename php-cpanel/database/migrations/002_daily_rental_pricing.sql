ALTER TABLE `Vehicle`
  ADD COLUMN `dailyPrice` DECIMAL(12, 2) NULL,
  ADD COLUMN `depositAmount` DECIMAL(12, 2) NULL;

ALTER TABLE `PaymentIntent`
  MODIFY `status` ENUM(
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'REVIEW_REQUIRED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING';

ALTER TABLE `Vehicle`
  ADD CONSTRAINT `Vehicle_stockCount_nonnegative` CHECK (`stockCount` >= 0),
  ADD CONSTRAINT `Vehicle_dailyPrice_positive` CHECK (`dailyPrice` IS NULL OR `dailyPrice` > 0),
  ADD CONSTRAINT `Vehicle_depositAmount_nonnegative` CHECK (`depositAmount` IS NULL OR `depositAmount` >= 0),
  ADD CONSTRAINT `Vehicle_monthlyPriceFrom_positive` CHECK (`monthlyPriceFrom` IS NULL OR `monthlyPriceFrom` > 0);

ALTER TABLE `VehiclePackage`
  ADD CONSTRAINT `VehiclePackage_duration_positive` CHECK (`durationMonths` > 0),
  ADD CONSTRAINT `VehiclePackage_annualKm_positive` CHECK (`annualKm` > 0),
  ADD CONSTRAINT `VehiclePackage_monthlyPrice_positive` CHECK (`monthlyPrice` > 0),
  ADD CONSTRAINT `VehiclePackage_deposit_nonnegative` CHECK (`depositAmount` IS NULL OR `depositAmount` >= 0);

ALTER TABLE `PaymentIntent`
  ADD CONSTRAINT `PaymentIntent_amount_positive` CHECK (`amount` > 0);

ALTER TABLE `Reservation`
  ADD CONSTRAINT `Reservation_period_valid` CHECK (`dropoffAt` > `pickupAt`),
  ADD CONSTRAINT `Reservation_hold_expiry_required` CHECK (`status` <> 'HOLD' OR `holdExpiresAt` IS NOT NULL);
