import { randomInt, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { sendAccountVerificationEmail } from "@/lib/mail/smtp";
import { contactVerificationRequestSchema } from "@/lib/validations/auth";
import {
  hashVerificationCode,
  maskVerificationTarget,
  normalizeEmail,
} from "@/lib/verification/contact";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const HOURLY_LIMIT = 5;

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: "Doğrulama servisine ulaşılamıyor." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactVerificationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Doğrulama bilgileri geçersiz." }, { status: 422 });
  }

  const channel = parsed.data.channel;
  const target = normalizeEmail(parsed.data.target);

  if (!/^\S+@\S+\.\S+$/.test(target)) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta adresi girin." },
      { status: 422 },
    );
  }

  const user = await prisma.user.findUnique({
    select: { email: true, emailVerified: true },
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  if (user.email === target && user.emailVerified) {
    return NextResponse.json({ error: "Bu iletişim bilgisi zaten doğrulanmış." }, { status: 422 });
  }

  const usedByAnotherAccount = await prisma.user.findFirst({
    select: { id: true },
    where: { email: target, id: { not: session.user.id } },
  });

  if (usedByAnotherAccount) {
    return NextResponse.json(
      { error: "Bu e-posta başka bir hesapta kullanılıyor." },
      { status: 409 },
    );
  }

  const now = new Date();
  const [recentChallenge, hourlyUserCount, hourlyTargetCount] = await Promise.all([
    prisma.verificationChallenge.findFirst({
      select: { createdAt: true },
      where: {
        channel,
        createdAt: { gt: new Date(now.getTime() - RESEND_WAIT_MS) },
        OR: [{ userId: session.user.id }, { target }],
      },
    }),
    prisma.verificationChallenge.count({
      where: {
        channel,
        createdAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) },
        userId: session.user.id,
      },
    }),
    prisma.verificationChallenge.count({
      where: {
        channel,
        createdAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) },
        target,
      },
    }),
  ]);

  if (recentChallenge) {
    const retryAfter = Math.max(
      1,
      Math.ceil((recentChallenge.createdAt.getTime() + RESEND_WAIT_MS - now.getTime()) / 1000),
    );
    return NextResponse.json(
      { error: `Yeni kod için ${retryAfter} saniye bekleyin.`, retryAfter },
      { headers: { "Retry-After": String(retryAfter) }, status: 429 },
    );
  }

  if (hourlyUserCount >= HOURLY_LIMIT || hourlyTargetCount >= HOURLY_LIMIT) {
    return NextResponse.json(
      { error: "Saatlik doğrulama kodu sınırına ulaştınız. Daha sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const challengeId = randomUUID();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await prisma.verificationChallenge.create({
    data: {
      channel,
      codeHash: hashVerificationCode({ challengeId, code, userId: session.user.id }),
      expiresAt,
      id: challengeId,
      target,
      userId: session.user.id,
    },
  });

  try {
    const sent = await sendAccountVerificationEmail({ code, email: target });

    if (!sent) {
      await prisma.verificationChallenge.delete({ where: { id: challengeId } }).catch(() => null);
      return NextResponse.json(
        { error: "E-posta gönderimi henüz yapılandırılmamış." },
        { status: 503 },
      );
    }
  } catch {
    await prisma.verificationChallenge.delete({ where: { id: challengeId } }).catch(() => null);
    return NextResponse.json(
      { error: "Doğrulama e-postası gönderilemedi." },
      { status: 502 },
    );
  }

  await prisma.verificationChallenge.updateMany({
    data: { consumedAt: now },
    where: {
      channel,
      consumedAt: null,
      id: { not: challengeId },
      userId: session.user.id,
    },
  });

  await prisma.verificationChallenge.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({
    challengeId,
    expiresInSeconds: CODE_TTL_MS / 1000,
    maskedTarget: maskVerificationTarget(channel, target),
    ok: true,
  });
}
