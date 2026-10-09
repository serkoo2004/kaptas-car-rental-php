import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { contactVerificationConfirmSchema } from "@/lib/validations/auth";
import { hashVerificationCode, verificationCodeMatches } from "@/lib/verification/contact";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: "Doğrulama servisine ulaşılamıyor." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactVerificationConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Altı haneli doğrulama kodunu girin." }, { status: 422 });
  }

  const challenge = await prisma.verificationChallenge.findFirst({
    where: { id: parsed.data.challengeId, userId },
  });
  const now = new Date();

  if (
    !challenge ||
    challenge.channel !== "EMAIL" ||
    challenge.consumedAt ||
    challenge.expiresAt <= now ||
    challenge.attempts >= MAX_ATTEMPTS
  ) {
    return NextResponse.json(
      { error: "Doğrulama kodunun süresi dolmuş veya kod artık geçersiz." },
      { status: 410 },
    );
  }

  const submittedHash = hashVerificationCode({
    challengeId: challenge.id,
    code: parsed.data.code,
    userId,
  });

  if (!verificationCodeMatches(challenge.codeHash, submittedHash)) {
    const incremented = await prisma.verificationChallenge.updateMany({
      data: { attempts: { increment: 1 } },
      where: {
        attempts: { lt: MAX_ATTEMPTS },
        consumedAt: null,
        expiresAt: { gt: now },
        id: challenge.id,
        userId,
      },
    });

    if (incremented.count !== 1) {
      return NextResponse.json(
        { error: "Doğrulama kodunun süresi dolmuş veya kod artık geçersiz." },
        { status: 410 },
      );
    }

    const attemptState = await prisma.verificationChallenge.findUnique({
      select: { attempts: true },
      where: { id: challenge.id },
    });
    const attempts = attemptState?.attempts ?? MAX_ATTEMPTS;

    if (attempts >= MAX_ATTEMPTS) {
      await prisma.verificationChallenge.updateMany({
        data: { consumedAt: now },
        where: { consumedAt: null, id: challenge.id },
      });
    }
    return NextResponse.json(
      {
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts),
        error: "Doğrulama kodu hatalı.",
      },
      { status: 422 },
    );
  }

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.verificationChallenge.updateMany({
        data: { consumedAt: now },
        where: {
          attempts: { lt: MAX_ATTEMPTS },
          consumedAt: null,
          expiresAt: { gt: now },
          id: challenge.id,
          userId,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("Doğrulama kodu daha önce kullanılmış.");
      }

      const updated = await transaction.user.update({
        data: { email: challenge.target, emailVerified: now },
        select: { email: true, emailVerified: true },
        where: { id: userId },
      });

      await transaction.verificationChallenge.updateMany({
        data: { consumedAt: now },
        where: {
          channel: challenge.channel,
          consumedAt: null,
          userId,
        },
      });

      return updated;
    });

    return NextResponse.json({
      channel: challenge.channel,
      ok: true,
      user: {
        ...user,
        emailVerified: user.emailVerified?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Bu e-posta başka bir hesapta kullanılıyor." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Doğrulama tamamlanamadı." }, { status: 500 });
  }
}
