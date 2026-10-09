const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const [
    invalidVehicles,
    invalidPackages,
    invalidReservations,
    confirmedWithoutPayment,
    paidWithoutConfirmation,
    multipleCovers,
    orphanReferences,
    publishedWithoutPrice,
  ] = await Promise.all([
    prisma.$queryRawUnsafe(
      "SELECT id FROM Vehicle WHERE stockCount < 0 OR (dailyPrice IS NOT NULL AND dailyPrice <= 0) OR (depositAmount IS NOT NULL AND depositAmount < 0)",
    ),
    prisma.$queryRawUnsafe(
      "SELECT id FROM VehiclePackage WHERE durationMonths <= 0 OR annualKm <= 0 OR monthlyPrice <= 0 OR (depositAmount IS NOT NULL AND depositAmount < 0)",
    ),
    prisma.$queryRawUnsafe(
      "SELECT id FROM Reservation WHERE dropoffAt <= pickupAt OR (status = 'HOLD' AND holdExpiresAt IS NULL)",
    ),
    prisma.reservation.findMany({
      select: { id: true },
      where: {
        status: "CONFIRMED",
        OR: [
          { paymentIntentId: null },
          { paymentIntent: { status: { not: "PAID" } } },
        ],
      },
    }),
    prisma.reservation.findMany({
      select: { id: true },
      where: {
        paymentIntent: { status: "PAID" },
        status: { not: "CONFIRMED" },
      },
    }),
    prisma.$queryRawUnsafe(
      "SELECT vehicleId FROM VehicleImage WHERE isCover = 1 GROUP BY vehicleId HAVING COUNT(*) > 1",
    ),
    prisma.$queryRawUnsafe(
      "SELECT " +
        "(SELECT COUNT(*) FROM CompareListItem c LEFT JOIN Vehicle v ON v.id = c.vehicleId WHERE v.id IS NULL) AS compareVehicle, " +
        "(SELECT COUNT(*) FROM CustomerActivity c LEFT JOIN QuoteRequest q ON q.id = c.quoteRequestId WHERE c.quoteRequestId IS NOT NULL AND q.id IS NULL) AS activityQuote, " +
        "(SELECT COUNT(*) FROM LeadAssignment l LEFT JOIN QuoteRequest q ON q.id = l.quoteRequestId WHERE q.id IS NULL) AS assignmentQuote",
    ),
    prisma.vehicle.findMany({
      select: { id: true, title: true },
      where: { dailyPrice: null, isPublishedWeb: true },
    }),
  ]);

  const errors = {
    confirmedWithoutPayment,
    invalidPackages,
    invalidReservations,
    invalidVehicles,
    multipleCovers,
    orphanReferences: orphanReferences.filter((record) =>
      Object.values(record).some((value) => Number(value) > 0),
    ),
    paidWithoutConfirmation,
  };
  const errorCount = Object.values(errors).reduce(
    (total, records) => total + records.length,
    0,
  );

  console.log(JSON.stringify({ errors, warnings: { publishedWithoutPrice } }, null, 2));

  if (errorCount > 0) {
    throw new Error(`Veri bütünlüğü denetimi ${errorCount} hata buldu.`);
  }

  console.log("Veri bütünlüğü denetimi başarılı.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
