-- Bireysel günlük kiralama akışında eski uzun dönem paket verilerini kaldır.
DELETE FROM `VehiclePackage`;

UPDATE `Vehicle`
SET
  `monthlyPriceFrom` = NULL,
  `depositAmount` = NULL;
