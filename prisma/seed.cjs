const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  await seedAdmin();
  await seedSettings();
}

async function seedAdmin() {
  const email = String(
    process.env.SEED_ADMIN_EMAIL || "yonetim@kaptas.com.tr",
  ).toLocaleLowerCase("tr-TR");
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD en az 8 karakter olmalidir.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    create: {
      email,
      emailVerified: new Date(),
      name: "KAPTAŞ Ana Yönetim",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    update: {
      emailVerified: new Date(),
      name: "KAPTAŞ Ana Yönetim",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    where: { email },
  });
}

async function seedSettings() {
  await prisma.systemSetting.upsert({
    create: {
      group: "brand",
      key: "brand.name",
      value: "KAPTAŞ",
    },
    update: {
      group: "brand",
      value: "KAPTAŞ",
    },
    where: { key: "brand.name" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
