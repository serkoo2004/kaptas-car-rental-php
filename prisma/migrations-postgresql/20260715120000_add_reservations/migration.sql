CREATE TYPE "ReservationStatus" AS ENUM ('HOLD', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT,
    "quoteRequestId" TEXT,
    "paymentIntentId" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'HOLD',
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "dropoffAt" TIMESTAMP(3) NOT NULL,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "holdExpiresAt" TIMESTAMP(3),
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "cancellationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Reservation_quoteRequestId_key" ON "Reservation"("quoteRequestId");
CREATE UNIQUE INDEX "Reservation_paymentIntentId_key" ON "Reservation"("paymentIntentId");
CREATE INDEX "Reservation_vehicleId_status_pickupAt_dropoffAt_idx" ON "Reservation"("vehicleId", "status", "pickupAt", "dropoffAt");
CREATE INDEX "Reservation_status_holdExpiresAt_idx" ON "Reservation"("status", "holdExpiresAt");
CREATE INDEX "Reservation_pickupAt_idx" ON "Reservation"("pickupAt");
CREATE INDEX "Reservation_dropoffAt_idx" ON "Reservation"("dropoffAt");

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
