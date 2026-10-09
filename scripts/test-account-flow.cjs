const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = process.env.ACCOUNT_TEST_BASE_URL || "http://127.0.0.1:3000";

function mergeCookies(current, response) {
  const cookies = new Map(
    current
      .split("; ")
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf("=");
        return [cookie.slice(0, separator), cookie.slice(separator + 1)];
      }),
  );

  for (const header of response.headers.getSetCookie()) {
    const cookie = header.split(";", 1)[0];
    const separator = cookie.indexOf("=");
    cookies.set(cookie.slice(0, separator), cookie.slice(separator + 1));
  }

  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function expectStatus(response, status, label) {
  if (response.status !== status) {
    const body = await response.text();
    throw new Error(`${label}: ${status} bekleniyordu, ${response.status} alındı. ${body}`);
  }
}

async function main() {
  const suffix = randomUUID();
  const email = `account-smoke-${suffix}@example.invalid`;
  const phone = `+905${String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, "0")}`;
  const password = `Test-${suffix}`;
  let userId;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        name: "Account Smoke Test",
        passwordHash: await bcrypt.hash(password, 12),
        status: "ACTIVE",
      },
      select: { id: true },
    });
    userId = user.id;

    let cookies = "";
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    await expectStatus(csrfResponse, 200, "CSRF");
    cookies = mergeCookies(cookies, csrfResponse);
    const { csrfToken } = await csrfResponse.json();

    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      body: new URLSearchParams({ callbackUrl: baseUrl, csrfToken, email, json: "true", password }),
      headers: { Cookie: cookies, "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      redirect: "manual",
    });
    if (![200, 302].includes(loginResponse.status)) {
      await expectStatus(loginResponse, 200, "Giriş");
    }
    cookies = mergeCookies(cookies, loginResponse);

    const profileResponse = await fetch(`${baseUrl}/api/account`, { headers: { Cookie: cookies } });
    await expectStatus(profileResponse, 200, "Hesap okuma");

    const adminResponse = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: cookies },
      redirect: "manual",
    });
    if (adminResponse.status === 200) {
      throw new Error("Normal kullanıcı admin paneline erişebildi.");
    }

    const updateResponse = await fetch(`${baseUrl}/api/account`, {
      body: JSON.stringify({
        address: "Test Mahallesi 1. Sokak No: 1",
        city: "Trabzon",
        district: "Ortahisar",
        name: "Account Smoke Test",
        phone,
      }),
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      method: "PATCH",
    });
    await expectStatus(updateResponse, 200, "Adres güncelleme");
    const updated = await updateResponse.json();
    if (updated.user.address !== "Test Mahallesi 1. Sokak No: 1" || updated.user.phone !== phone) {
      throw new Error("Adres veya telefon değişikliği API yanıtına yansımadı.");
    }

    const sameEmailResponse = await fetch(`${baseUrl}/api/account/verifications/request`, {
      body: JSON.stringify({ channel: "EMAIL", target: email }),
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      method: "POST",
    });
    await expectStatus(sameEmailResponse, 422, "Aynı e-posta koruması");

    const invalidCodeResponse = await fetch(`${baseUrl}/api/account/verifications/confirm`, {
      body: JSON.stringify({ challengeId: randomUUID(), code: "123456" }),
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      method: "POST",
    });
    await expectStatus(invalidCodeResponse, 410, "Geçersiz kod koruması");

    await prisma.user.update({
      data: { status: "SUSPENDED" },
      where: { id: userId },
    });
    const suspendedResponse = await fetch(`${baseUrl}/api/account`, {
      headers: { Cookie: cookies },
    });
    await expectStatus(suspendedResponse, 401, "Askıya alınmış hesap koruması");
    await prisma.user.update({
      data: { status: "ACTIVE" },
      where: { id: userId },
    });

    console.log("Hesap, adres, doğrulama ve askıya alma güvenlik akışı başarılı.");
  } finally {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => null);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
