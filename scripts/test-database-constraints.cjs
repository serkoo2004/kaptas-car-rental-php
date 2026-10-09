const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("node:crypto");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function expectConstraint(label, operation, cleanup) {
  try {
    const result = await operation();
    await cleanup?.(result);
  } catch {
    return;
  }

  throw new Error(`${label} veritabanı tarafından engellenmedi.`);
}

async function main() {
  const vehicle = await prisma.vehicle.findFirst({
    select: { id: true, stockCount: true },
  });

  if (!vehicle) {
    throw new Error("Kısıt testi için araç bulunamadı.");
  }

  const user = await prisma.user.findFirst({ select: { id: true } });

  if (!user) {
    throw new Error("Doğrulama kısıt testi için kullanıcı bulunamadı.");
  }

  await expectConstraint(
    "Negatif stok",
    () =>
      prisma.vehicle.update({
        data: { stockCount: -1 },
        where: { id: vehicle.id },
      }),
    () =>
      prisma.vehicle.update({
        data: { stockCount: vehicle.stockCount },
        where: { id: vehicle.id },
      }),
  );

  await expectConstraint(
    "Negatif doğrulama denemesi",
    () =>
      prisma.verificationChallenge.create({
        data: {
          attempts: -1,
          channel: "EMAIL",
          codeHash: "constraint-test",
          expiresAt: new Date(Date.now() + 60_000),
          id: randomUUID(),
          target: "constraint@example.invalid",
          userId: user.id,
        },
      }),
    (challenge) =>
      prisma.verificationChallenge.delete({ where: { id: challenge.id } }),
  );

  await expectConstraint(
    "Sıfır ödeme tutarı",
    () => prisma.paymentIntent.create({ data: { amount: 0 } }),
    (payment) => prisma.paymentIntent.delete({ where: { id: payment.id } }),
  );

  const pickupAt = new Date(Date.now() + 7 * 86_400_000);
  await expectConstraint(
    "Geçersiz rezervasyon tarih aralığı",
    () =>
      prisma.reservation.create({
        data: {
          customerEmail: "constraint@example.invalid",
          customerName: "Constraint Test",
          dropoffAt: pickupAt,
          holdExpiresAt: new Date(Date.now() + 15 * 60_000),
          pickupAt,
          vehicleId: vehicle.id,
        },
      }),
    (reservation) => prisma.reservation.delete({ where: { id: reservation.id } }),
  );

  console.log("MySQL stok, ödeme, rezervasyon ve doğrulama CHECK kısıtları başarılı.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
