import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryLocationName } from "@/lib/locations/primary";
import {
  createReservationHold,
  parseRentalPeriod,
  RentalPeriodError,
  ReservationUnavailableError,
} from "@/lib/reservations/availability";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";
import { normalizeCurrency } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, "rental-intent", 10, 10 * 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla rezervasyon denemesi yapıldı. Lütfen daha sonra tekrar deneyin." },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const vehicleId = text(body, "vehicleId");
  const contactName = text(body, "contactName");
  const contactEmail = text(body, "contactEmail");
  const contactPhone = text(body, "contactPhone");
  const primaryLocation = await getPrimaryLocationName();
  const pickupLocation = primaryLocation;
  const dropoffLocation = primaryLocation;
  const pickupDate = text(body, "pickupDate");
  const pickupTime = text(body, "pickupTime");
  const dropoffDate = text(body, "dropoffDate");
  const dropoffTime = text(body, "dropoffTime");
  const currency = normalizeCurrency(text(body, "currency"));

  if (
    !vehicleId ||
    !contactName ||
    !contactEmail ||
    !contactPhone ||
    contactName.length > 100 ||
    !/^\S+@\S+\.\S+$/.test(contactEmail) ||
    contactEmail.length > 190 ||
    !/^\+?[0-9\s()-]{10,20}$/.test(contactPhone)
  ) {
    return NextResponse.json(
      { error: "Araç ve iletişim bilgileri zorunludur." },
      { status: 422 },
    );
  }

  const rentalFields = [pickupDate, pickupTime, dropoffDate, dropoffTime];
  const hasAnyRentalField = rentalFields.some(Boolean);
  const hasCompleteRentalPeriod = rentalFields.every(Boolean);
  let rentalPeriod: ReturnType<typeof parseRentalPeriod> | null = null;

  if (hasAnyRentalField && !hasCompleteRentalPeriod) {
    return NextResponse.json(
      { error: "Tarih seçilecekse alış ve bırakış tarihi ile saatleri eksiksiz girilmelidir." },
      { status: 422 },
    );
  }

  if (hasCompleteRentalPeriod) {
    try {
      rentalPeriod = parseRentalPeriod({
        dropoffDate,
        dropoffTime,
        pickupDate,
        pickupTime,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof RentalPeriodError
              ? error.message
              : "Kiralama tarihleri geçersiz.",
        },
        { status: 422 },
      );
    }
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Veritabanı bağlantısı yok." },
      { status: 503 },
    );
  }

  const vehicle = await prisma.vehicle.findFirst({
    include: { brand: true, model: true },
    where: {
      id: vehicleId,
      isPublishedWeb: true,
      status: "PUBLISHED",
      stockCount: { gt: 0 },
    },
  });

  if (!vehicle) {
    return NextResponse.json(
      { error: "Seçilen araç kiralamaya uygun değil." },
      { status: 404 },
    );
  }

  if (!vehicle.dailyPrice || Number(vehicle.dailyPrice) <= 0) {
    return NextResponse.json(
      { error: "Bu araç için günlük kiralama fiyatı henüz tanımlanmadı." },
      { status: 409 },
    );
  }

  const session = await getCurrentSession();
  const userId =
    session?.user?.status === "ACTIVE" ? session.user.id ?? null : null;

  const quote = await prisma.quoteRequest.create({
    data: {
      commercialConsentAt: new Date(),
      contactEmail: contactEmail.toLowerCase(),
      contactName,
      contactPhone,
      items: {
        create: {
          brandText: vehicle.brand.name,
          modelText: vehicle.model.name,
          vehicleId: vehicle.id,
        },
      },
      kvkkAcceptedAt: new Date(),
      note: [
        "Ödeme öncesi kiralama talebi oluşturuldu. Bu kayıt kesin rezervasyon değildir.",
        pickupLocation ? `Alış: ${pickupLocation}` : null,
        rentalPeriod ? null : "Kiralama tarihi ödeme adımında seçilecek.",
        dropoffLocation ? `Bırakış: ${dropoffLocation}` : null,
        pickupDate ? `Alış zamanı: ${pickupDate} ${pickupTime}` : null,
        dropoffDate ? `Bırakış zamanı: ${dropoffDate} ${dropoffTime}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      source: "seko-front-rental",
      userId,
      userType: "INDIVIDUAL",
    },
  });

  if (rentalPeriod) {
    try {
      await createReservationHold({
        customerEmail: contactEmail.toLowerCase(),
        customerName: contactName,
        customerPhone: contactPhone,
        dropoffAt: rentalPeriod.dropoffAt,
        dropoffLocation: dropoffLocation || pickupLocation,
        pickupAt: rentalPeriod.pickupAt,
        pickupLocation,
        quoteRequestId: quote.id,
        userId,
        vehicleId: vehicle.id,
      });
    } catch (error) {
      await prisma.quoteRequest.delete({ where: { id: quote.id } }).catch(() => null);

      if (error instanceof ReservationUnavailableError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json(
        { error: "Rezervasyon bekletmesi oluşturulamadı." },
        { status: 500 },
      );
    }
  }

  const redirectUrl = new URL("/satin-al", request.url);
  redirectUrl.searchParams.set("vehicleId", vehicleId);
  redirectUrl.searchParams.set("leadId", quote.id);
  redirectUrl.searchParams.set("currency", currency);
  setIfPresent(redirectUrl, "pickupLocation", pickupLocation);
  setIfPresent(redirectUrl, "dropoffLocation", dropoffLocation || pickupLocation);
  setIfPresent(redirectUrl, "pickupDate", pickupDate);
  setIfPresent(redirectUrl, "pickupTime", pickupTime);
  setIfPresent(redirectUrl, "dropoffDate", dropoffDate);
  setIfPresent(redirectUrl, "dropoffTime", dropoffTime);

  return NextResponse.json({
    leadId: quote.id,
    ok: true,
    redirectUrl: `${redirectUrl.pathname}${redirectUrl.search}`,
  });
}

function text(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}

function setIfPresent(url: URL, key: string, value: string) {
  if (value) {
    url.searchParams.set(key, value);
  }
}
