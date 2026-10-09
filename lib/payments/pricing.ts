const MILLISECONDS_PER_DAY = 86_400_000;
export function calculateRentalCharge(
  dailyRate: number,
  pickupAt: Date,
  dropoffAt: Date,
) {
  const duration = dropoffAt.getTime() - pickupAt.getTime();
  const billableDays = Math.max(1, Math.ceil(duration / MILLISECONDS_PER_DAY));

  if (dailyRate <= 0 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error("Kiralama ücreti hesaplanamadı.");
  }

  return {
    billableDays,
    dailyRate,
    total: dailyRate * billableDays,
  };
}
