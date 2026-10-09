import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { isSmtpConfigured } from "@/lib/mail/smtp";
import { expireStaleReservationHolds } from "@/lib/reservations/availability";
import { accountProfileSchema } from "@/lib/validations/auth";
import { normalizeTurkeyPhone } from "@/lib/verification/contact";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: "Hesap bilgilerine şu anda ulaşılamıyor." }, { status: 503 });
  }

  await expireStaleReservationHolds();

  const user = await prisma.user.findUnique({
    select: {
      address: true,
      city: true,
      createdAt: true,
      district: true,
      email: true,
      emailVerified: true,
      id: true,
      name: true,
      phone: true,
      reservations: {
        include: {
          paymentIntent: true,
          vehicle: {
            include: {
              brand: true,
              images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 },
              model: true,
            },
          },
        },
        orderBy: { pickupAt: "desc" },
        take: 50,
      },
    },
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    rentals: user.reservations.map((reservation) => ({
      cancellationNote: reservation.cancellationNote,
      createdAt: reservation.createdAt.toISOString(),
      dropoffAt: reservation.dropoffAt.toISOString(),
      dropoffLocation: reservation.dropoffLocation,
      holdExpiresAt: reservation.holdExpiresAt?.toISOString() ?? null,
      id: reservation.id,
      payment: reservation.paymentIntent
        ? {
            amount: Number(reservation.paymentIntent.amount),
            currency: reservation.paymentIntent.currency,
            provider: reservation.paymentIntent.provider,
            providerRef: reservation.paymentIntent.providerRef,
            status: reservation.paymentIntent.status,
          }
        : null,
      pickupAt: reservation.pickupAt.toISOString(),
      pickupLocation: reservation.pickupLocation,
      status: reservation.status,
      vehicle: {
        brand: reservation.vehicle.brand.name,
        coverImage: reservation.vehicle.images[0]?.url ?? null,
        model: reservation.vehicle.model.name,
        title: reservation.vehicle.title,
      },
    })),
    user: {
      address: user.address ?? "",
      city: user.city ?? "",
      createdAt: user.createdAt.toISOString(),
      district: user.district ?? "",
      email: user.email,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      id: user.id,
      name: user.name ?? "",
      phone: user.phone ?? "",
    },
    verificationServices: {
      email: isSmtpConfigured(),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: "Hesap bilgileri şu anda güncellenemiyor." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accountProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Bilgiler geçersiz." },
      { status: 422 },
    );
  }

  const phone = parsed.data.phone ? normalizeTurkeyPhone(parsed.data.phone) : null;

  if (parsed.data.phone && !phone) {
    return NextResponse.json({ error: "Geçerli bir Türkiye cep telefonu numarası girin." }, { status: 422 });
  }

  let user;
  try {
    user = await prisma.user.update({
      data: {
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        district: parsed.data.district || null,
        name: parsed.data.name,
        phone,
        phoneVerifiedAt: null,
      },
      select: {
        address: true,
        city: true,
        createdAt: true,
        district: true,
        email: true,
        emailVerified: true,
        id: true,
        name: true,
        phone: true,
      },
      where: { id: session.user.id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Bu telefon numarası başka bir hesapta kullanılıyor." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      address: user.address ?? "",
      city: user.city ?? "",
      createdAt: user.createdAt.toISOString(),
      district: user.district ?? "",
      emailVerified: user.emailVerified?.toISOString() ?? null,
      name: user.name ?? "",
      phone: user.phone ?? "",
    },
  });
}
