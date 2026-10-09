const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const MODEL_ORDER = [
  "Company",
  "User",
  "VerificationChallenge",
  "Account",
  "Session",
  "VerificationToken",
  "Driver",
  "DeviceSession",
  "ConsentRecord",
  "Permission",
  "RolePermission",
  "VehicleBrand",
  "VehicleModel",
  "Vehicle",
  "VehicleImage",
  "VehicleFeature",
  "VehiclePackage",
  "FavoriteVehicle",
  "CompareList",
  "CompareListItem",
  "QuoteRequest",
  "QuoteRequestItem",
  "QuoteOffer",
  "QuoteOfferItem",
  "QuoteStatusHistory",
  "LeadAssignment",
  "AdminNote",
  "Document",
  "CustomerActivity",
  "Notification",
  "NotificationDelivery",
  "PushToken",
  "BlogCategory",
  "BlogPost",
  "FAQ",
  "ServicePage",
  "PaymentIntent",
  "Reservation",
  "PricingRule",
  "BranchLocation",
  "SystemSetting",
  "AuditLog",
];

async function main() {
  const backupArgument = process.argv[2];

  if (!backupArgument) {
    throw new Error("Usage: npm run db:restore -- <backup-file.json>");
  }

  if (process.env.ALLOW_DATABASE_RESTORE !== "true") {
    throw new Error(
      "Set ALLOW_DATABASE_RESTORE=true before restoring a database backup.",
    );
  }

  const backupPath = path.resolve(backupArgument);
  const payload = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  if (payload.formatVersion !== 1 || !payload.models) {
    throw new Error("Unsupported or invalid database backup file.");
  }

  let restoredCount = 0;

  for (const modelName of MODEL_ORDER) {
    const records = payload.models[modelName] ?? [];

    if (records.length === 0) {
      continue;
    }

    const clientName = modelName[0].toLowerCase() + modelName.slice(1);
    const result = await prisma[clientName].createMany({
      data: records,
      skipDuplicates: true,
    });

    restoredCount += result.count;
    console.log(`${modelName}: ${result.count} record(s) restored`);
  }

  console.log(`Database restore complete. Records restored: ${restoredCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
