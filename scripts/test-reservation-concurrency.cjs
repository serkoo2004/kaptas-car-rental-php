const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("node:crypto");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = process.env.RESERVATION_TEST_BASE_URL || "http://127.0.0.1:3000";

function turkeyDate(daysFromNow) {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(date);
}

async function main() {
  const suffix = randomUUID();
  const email = `reservation-smoke-${suffix}@example.invalid`;
  const noDateEmail = `reservation-no-date-${suffix}@example.invalid`;
  const testEmails = [email, noDateEmail];
  const vehicle = await prisma.vehicle.findFirst({
    select: { dailyPrice: true, id: true, stockCount: true },
    where: { isPublishedWeb: true, status: "PUBLISHED", stockCount: { gt: 0 } },
  });

  if (!vehicle) {
    throw new Error("Rezervasyon testi için yayındaki bir araç bulunamadı.");
  }

  const requestBody = {
    contactEmail: email,
    contactName: "Reservation Smoke Test",
    contactPhone: "05550000000",
    dropoffDate: turkeyDate(47),
    dropoffTime: "10:00",
    pickupDate: turkeyDate(45),
    pickupTime: "10:00",
    vehicleId: vehicle.id,
  };

  try {
    await prisma.vehicle.update({
      data: { dailyPrice: vehicle.dailyPrice ?? 1500, stockCount: 2 },
      where: { id: vehicle.id },
    });

    const noDateResponse = await fetch(`${baseUrl}/api/public/rental-intents`, {
      body: JSON.stringify({
        contactEmail: noDateEmail,
        contactName: "No Date Rental Test",
        contactPhone: "05550000000",
        currency: "USD",
        vehicleId: vehicle.id,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const noDatePayload = await noDateResponse.json();

    if (
      noDateResponse.status !== 200 ||
      !String(noDatePayload.redirectUrl).startsWith("/satin-al?") ||
      String(noDatePayload.redirectUrl).includes("pickupDate=")
    ) {
      throw new Error(`Tarihsiz kiralama geçişi başarısız: ${noDateResponse.status} ${JSON.stringify(noDatePayload)}`);
    }

    const noDateQuote = await prisma.quoteRequest.findFirst({
      include: { reservation: true },
      where: { contactEmail: noDateEmail },
    });

    if (!noDateQuote || noDateQuote.reservation) {
      throw new Error("Tarih seçilmeden araç stoğu gereksiz yere beklemeye alındı.");
    }

    const responses = await Promise.all(
      [1, 2, 3].map(() =>
        fetch(`${baseUrl}/api/public/rental-intents`, {
          body: JSON.stringify(requestBody),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      ),
    );
    const statuses = responses.map((response) => response.status).sort();

    if (statuses[0] !== 200 || statuses[1] !== 200 || statuses[2] !== 409) {
      const bodies = await Promise.all(responses.map((response) => response.text()));
      throw new Error(
        `Eşzamanlı rezervasyon koruması başarısız: ${statuses.join(", ")} ${bodies.join(" | ")}`,
      );
    }

    console.log("Tarihsiz ödeme geçişi ve adet bazlı rezervasyon koruması başarılı.");
  } finally {
    const quotes = await prisma.quoteRequest.findMany({
      select: { id: true },
      where: { contactEmail: { in: testEmails } },
    });
    const quoteIds = quotes.map((quote) => quote.id);

    if (quoteIds.length > 0) {
      await prisma.reservation.deleteMany({
        where: { quoteRequestId: { in: quoteIds } },
      });
      await prisma.quoteRequest.deleteMany({ where: { id: { in: quoteIds } } });
    }

    await prisma.vehicle.update({
      data: { dailyPrice: vehicle.dailyPrice, stockCount: vehicle.stockCount },
      where: { id: vehicle.id },
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
