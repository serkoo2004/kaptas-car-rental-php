import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { createPasswordResetToken } from "../lib/auth/password-reset-token.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const email = `password-reset-${randomUUID()}@example.invalid`;
  const oldPassword = `Old-${randomUUID()}`;
  const newPassword = `New-${randomUUID()}!`;
  const { token, tokenHash } = createPasswordResetToken();

  if (token === tokenHash || token.length !== 64 || tokenHash.length !== 64) {
    throw new Error("Şifre sıfırlama token üretimi güvenli değil.");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "Password Reset Test",
      passwordHash: await bcrypt.hash(oldPassword, 12),
      role: "USER",
      status: "ACTIVE",
    },
  });

  try {
    await prisma.verificationToken.create({
      data: {
        expires: new Date(Date.now() + 60_000),
        identifier: email,
        token: tokenHash,
      },
    });

    const firstUse = await completeReset({ email, password: newPassword, token, tokenHash });
    const secondUse = await completeReset({ email, password: oldPassword, token, tokenHash });
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    if (!firstUse || secondUse || !updated.passwordHash) {
      throw new Error("Tek kullanımlık şifre sıfırlama akışı başarısız.");
    }

    if (!(await bcrypt.compare(newPassword, updated.passwordHash))) {
      throw new Error("Yeni şifre güvenli biçimde kaydedilmedi.");
    }

    if (await bcrypt.compare(oldPassword, updated.passwordHash)) {
      throw new Error("Eski şifre sıfırlama sonrasında geçerli kaldı.");
    }
  } finally {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  console.log("Şifre sıfırlama token, tek kullanım ve parola yenileme testi başarılı.");
}

async function completeReset({ email, password, token, tokenHash }) {
  const calculatedHash = createHash("sha256").update(token).digest("hex");

  if (calculatedHash !== tokenHash) {
    return false;
  }

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.verificationToken.deleteMany({
      where: {
        expires: { gte: new Date() },
        identifier: email,
        token: calculatedHash,
      },
    });

    if (claimed.count !== 1) {
      return false;
    }

    await transaction.user.update({
      data: { passwordHash: await bcrypt.hash(password, 12) },
      where: { email },
    });

    return true;
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
