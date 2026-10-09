const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const vehicles = [
  {
    bodyType: "SUV",
    brand: "Renault",
    brandSlug: "renault",
    enginePower: "145 hp",
    features: [
      ["Paket", "Evolution"],
      ["Motor", "Turbo TCe 145 hp"],
      ["Yakit", "Benzin"],
      ["Sanziman", "Otomatik"],
    ],
    fuelType: "GASOLINE",
    model: "Duster",
    modelSlug: "duster",
    segment: "C-SUV",
    slug: "renault-duster-evolution-tce-145",
    stockCount: 3,
    title: "Renault Duster Evolution Turbo TCe 145 hp",
    transmission: "AUTOMATIC",
  },
  {
    bodyType: "MPV",
    brand: "Renault",
    brandSlug: "renault",
    enginePower: "130 hp",
    features: [
      ["Paket", "Equilibre"],
      ["Motor", "1.3 TCe 130 hp"],
      ["Yakit", "Benzin"],
      ["Sanziman", "Otomatik"],
    ],
    fuelType: "GASOLINE",
    model: "Kangoo Multix",
    modelSlug: "kangoo-multix",
    segment: "Hafif Ticari",
    slug: "renault-kangoo-multix-equilibre-tce-130",
    stockCount: 2,
    title: "Renault Kangoo Multix Equilibre 1.3 TCe 130 hp",
    transmission: "AUTOMATIC",
  },
  {
    bodyType: "Crossover",
    brand: "Dacia",
    brandSlug: "dacia",
    enginePower: "120 hp",
    features: [
      ["Paket", "Expression"],
      ["Motor", "120 hp"],
      ["Yakit", "Benzin + LPG"],
      ["Sanziman", "Otomatik"],
    ],
    fuelType: "GASOLINE_LPG",
    model: "Sandero Stepway",
    modelSlug: "sandero-stepway",
    segment: "B-Crossover",
    slug: "dacia-sandero-stepway-expression-lpg-120",
    stockCount: 5,
    title: "Dacia Sandero Stepway Expression Benzin + LPG 120 hp",
    transmission: "AUTOMATIC",
  },
];

async function importVehicle(item, actorId) {
  const existing = await prisma.vehicle.findUnique({
    select: { id: true, title: true },
    where: { slug: item.slug },
  });

  if (existing) {
    return { action: "skipped", id: existing.id, title: existing.title };
  }

  const brand = await prisma.vehicleBrand.upsert({
    create: { isActive: true, name: item.brand, slug: item.brandSlug },
    update: { isActive: true, name: item.brand },
    where: { slug: item.brandSlug },
  });
  const model = await prisma.vehicleModel.upsert({
    create: {
      bodyType: item.bodyType,
      brandId: brand.id,
      isActive: true,
      name: item.model,
      segment: item.segment,
      slug: item.modelSlug,
    },
    update: {
      bodyType: item.bodyType,
      isActive: true,
      name: item.model,
      segment: item.segment,
    },
    where: {
      brandId_slug: { brandId: brand.id, slug: item.modelSlug },
    },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      bodyType: item.bodyType,
      brandId: brand.id,
      deliveryStatus: "IN_STOCK",
      enginePower: item.enginePower,
      fuelType: item.fuelType,
      isFeatured: false,
      isPublishedMobile: false,
      isPublishedWeb: false,
      modelId: model.id,
      segment: item.segment,
      seoDescription: `${item.title} aracinin kiralama ve stok bilgileri.`,
      seoTitle: `${item.brand} ${item.model} kiralama`,
      slug: item.slug,
      status: "DRAFT",
      stockCount: item.stockCount,
      title: item.title,
      transmission: item.transmission,
      features: {
        create: item.features.map(([label, value], index) => ({
          group: "Donanim",
          label,
          sortOrder: index,
          value,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "VEHICLE_CREATED",
      actorId,
      after: {
        source: "Kaptas vehicle catalog import",
        stockCount: item.stockCount,
        title: item.title,
        vehicleId: vehicle.id,
      },
      entityId: vehicle.id,
      entityType: "Vehicle",
    },
  });

  return { action: "created", id: vehicle.id, title: vehicle.title };
}

async function main() {
  const admin = await prisma.user.findFirst({
    select: { id: true },
    where: { role: "SUPER_ADMIN", status: "ACTIVE" },
  });
  const results = [];

  for (const item of vehicles) {
    results.push(await importVehicle(item, admin?.id ?? null));
  }

  for (const result of results) {
    console.log(`${result.action}: ${result.title} (${result.id})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
