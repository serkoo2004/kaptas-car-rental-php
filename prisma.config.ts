import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.cjs",
  },
  schema: "prisma/schema.prisma",
});
