import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { registerSchema } from "@/lib/validations/auth";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, "register", 5, 60 * 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin." },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bilgileri kontrol edip tekrar deneyin." },
      { status: 422 },
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Kayıt servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }

  const data = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      select: { id: true },
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle kayıtlı bir hesap var." },
        { status: 409 },
      );
    }

    const acceptedAt = new Date();
    await prisma.user.create({
      data: {
        consentRecords: {
          create: [
            {
              acceptedAt,
              email: data.email,
              type: "KVKK",
              version: "2026-07-15",
            },
            ...(data.commercialConsent
              ? [
                  {
                    acceptedAt,
                    email: data.email,
                    type: "COMMERCIAL_COMMUNICATION",
                    version: "2026-07-15",
                  },
                ]
              : []),
          ],
        },
        email: data.email,
        name: data.name,
        passwordHash: await hashPassword(data.password),
        role: "USER",
        status: "ACTIVE",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle kayıtlı bir hesap var." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Kayıt tamamlanamadı. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
