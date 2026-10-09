import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { verifyIyzicoResponseSignature } from "../lib/payments/iyzico.ts";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = process.env.PUBLIC_API_TEST_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  const originalSecret = process.env.IYZICO_SECRET_KEY;
  process.env.IYZICO_SECRET_KEY = "sandbox-qaIiLIxhjMgx3LSKIVvp6j17NunHOFtD";

  const officialExample = {
    basketId: "basketId",
    conversationId: "conversationId",
    currency: "TRY",
    paidPrice: 10.5,
    paymentId: "22416032",
    price: "10.50",
    signature: "836c3a6c8db86c81043f2ca74edb13518b54a813f454f8dd762f0dd658610173",
  };
  const signatureFields = [
    "paymentId",
    "currency",
    "basketId",
    "conversationId",
    "paidPrice",
    "price",
  ];

  if (!verifyIyzicoResponseSignature(officialExample, signatureFields)) {
    throw new Error("Iyzico resmi imza doğrulama örneği reddedildi.");
  }

  if (
    verifyIyzicoResponseSignature(
      { ...officialExample, paidPrice: 10.6 },
      signatureFields,
    )
  ) {
    throw new Error("Değiştirilmiş ödeme tutarı geçerli imza olarak kabul edildi.");
  }

  if (originalSecret === undefined) {
    delete process.env.IYZICO_SECRET_KEY;
  } else {
    process.env.IYZICO_SECRET_KEY = originalSecret;
  }

  const paymentIntent = await prisma.paymentIntent.create({
    data: {
      amount: 123.45,
      currency: "TRY",
      metadata: { testRun: randomUUID() },
      provider: "iyzico",
      providerRef: `test-provider-${randomUUID()}`,
      status: "PENDING",
    },
  });

  try {
    const response = await fetch(`${baseUrl}/api/payments/iyzico/3ds-callback`, {
      body: new URLSearchParams({
        conversationData: "test",
        conversationId: paymentIntent.id,
        mdStatus: "1",
        paymentId: paymentIntent.providerRef,
        signature: "invalid-signature",
        status: "success",
      }),
      method: "POST",
      redirect: "manual",
    });

    if (![302, 303, 307, 308].includes(response.status)) {
      throw new Error(`Sahte callback yönlendirme yerine ${response.status} döndürdü.`);
    }

    const persisted = await prisma.paymentIntent.findUniqueOrThrow({
      where: { id: paymentIntent.id },
    });

    if (persisted.status !== "PENDING") {
      throw new Error("Sahte callback ödeme durumunu değiştirdi.");
    }
  } finally {
    await prisma.paymentIntent.delete({ where: { id: paymentIntent.id } });
  }

  console.log("Iyzico imza ve sahte callback korumaları başarılı.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
