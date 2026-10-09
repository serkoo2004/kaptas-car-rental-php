const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");
const { Prisma, PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const outputDirectory = path.join(process.cwd(), "storage", "database-backups");

async function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });

  const data = {};

  for (const model of Prisma.dmmf.datamodel.models) {
    const clientName = model.name[0].toLowerCase() + model.name.slice(1);
    data[model.name] = await prisma[clientName].findMany();
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(outputDirectory, `database-${timestamp}.json`);
  const payload = {
    createdAt: new Date().toISOString(),
    formatVersion: 1,
    models: data,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });

  const recordCount = Object.values(data).reduce(
    (total, records) => total + records.length,
    0,
  );

  console.log(`Database backup created: ${outputPath}`);
  console.log(`Records exported: ${recordCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
