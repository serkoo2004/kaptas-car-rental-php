const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("node:crypto");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = process.env.PUBLIC_API_TEST_BASE_URL || "http://127.0.0.1:3000";

async function expectStatus(response, status, label) {
  if (response.status !== status) {
    throw new Error(`${label}: ${status} bekleniyordu, ${response.status} alındı. ${await response.text()}`);
  }
}

function turkeyDate(daysFromNow) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date(Date.now() + daysFromNow * 86_400_000));
}

async function main() {
  const vehiclesResponse = await fetch(`${baseUrl}/api/public/vehicles?currency=USD`);
  await expectStatus(vehiclesResponse, 200, "Araç API");
  const vehiclePayload = await vehiclesResponse.json();

  if (vehiclePayload.source !== "database" || vehiclePayload.data.length === 0) {
    throw new Error("Araç API gerçek veritabanı kayıtlarını döndürmedi.");
  }

  if (vehiclePayload.currency !== "USD") {
    throw new Error("Araç API seçilen para birimini korumadı.");
  }

  for (const vehicle of vehiclePayload.data) {
    if (!vehicle.backendId || !String(vehicle.image).startsWith("/api/media/vehicles/")) {
      throw new Error("Araç API içinde yönetilmeyen veya eksik görsel bulundu.");
    }

    if (
      !Number.isInteger(vehicle.stockCount) ||
      !Number.isInteger(vehicle.availableCount) ||
      vehicle.stockCount < 1 ||
      vehicle.availableCount !== vehicle.stockCount
    ) {
      throw new Error("Araç API stok ve müsait adet bilgisini doğru döndürmedi.");
    }
  }

  const imageResponse = await fetch(`${baseUrl}${vehiclePayload.data[0].image}`);
  await expectStatus(imageResponse, 200, "Araç görseli");
  if (!imageResponse.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("Araç görseli doğru MIME türüyle sunulmadı.");
  }

  const locationsResponse = await fetch(`${baseUrl}/api/public/locations`);
  await expectStatus(locationsResponse, 200, "Lokasyon API");
  const locationPayload = await locationsResponse.json();
  if (!Array.isArray(locationPayload.locations) || locationPayload.locations.length !== 1) {
    throw new Error("Aktif tek lokasyon kuralı API yanıtına yansımadı.");
  }

  const accountResponse = await fetch(`${baseUrl}/api/account`);
  await expectStatus(accountResponse, 401, "Anonim hesap koruması");

  const adminResponse = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
  if (adminResponse.status === 200) {
    throw new Error("Anonim kullanıcı admin paneline erişebildi.");
  }

  const invalidContactResponse = await fetch(`${baseUrl}/api/public/contact`, {
    body: JSON.stringify({
      contactEmail: "yanlis",
      contactName: "A",
      contactPhone: "1",
      message: "kısa",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  await expectStatus(invalidContactResponse, 422, "İletişim doğrulaması");

  const unpricedVehicle = vehiclePayload.data.find((vehicle) => !vehicle.canBook);
  if (unpricedVehicle) {
    const email = `unpriced-${randomUUID()}@example.invalid`;
    const before = await prisma.quoteRequest.count({ where: { contactEmail: email } });
    const rentalResponse = await fetch(`${baseUrl}/api/public/rental-intents`, {
      body: JSON.stringify({
        contactEmail: email,
        contactName: "Public API Test",
        contactPhone: "05550000000",
        dropoffDate: turkeyDate(12),
        dropoffTime: "10:00",
        pickupDate: turkeyDate(10),
        pickupTime: "10:00",
        currency: "USD",
        vehicleId: unpricedVehicle.backendId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    await expectStatus(rentalResponse, 409, "Fiyatsız araç koruması");
    const after = await prisma.quoteRequest.count({ where: { contactEmail: email } });
    if (before !== after) {
      throw new Error("Fiyatı olmayan araç için gereksiz talep kaydı oluşturuldu.");
    }
  }

  console.log("Public API, görsel, lokasyon, fiyat ve erişim korumaları başarılı.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
