import { createHmac, timingSafeEqual } from "crypto";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTurkeyPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (!/^5\d{9}$/.test(digits)) {
    return null;
  }

  return `+90${digits}`;
}

export function hashVerificationCode({
  challengeId,
  code,
  userId,
}: {
  challengeId: string;
  code: string;
  userId: string;
}) {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET tanımlı değil.");
  }

  return createHmac("sha256", secret)
    .update(`${challengeId}:${userId}:${code}`)
    .digest("hex");
}

export function verificationCodeMatches(expectedHash: string, actualHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function maskVerificationTarget(channel: "EMAIL" | "PHONE", target: string) {
  if (channel === "PHONE") {
    return `${target.slice(0, 5)} *** ** ${target.slice(-2)}`;
  }

  const [local, domain] = target.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
