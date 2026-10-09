import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { checkRequestRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, "contact", 5, 10 * 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin." },
      { headers: { "Retry-After": String(rateLimit.retryAfter) }, status: 429 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const contactName = text(body, "contactName") || text(body, "name");
  const contactEmail = text(body, "contactEmail") || text(body, "email");
  const contactPhone = text(body, "contactPhone") || text(body, "phone");
  const companyName = text(body, "companyName");
  const message = text(body, "message");

  if (
    contactName.length < 2 ||
    contactName.length > 100 ||
    !/^\S+@\S+\.\S+$/.test(contactEmail) ||
    contactEmail.length > 190 ||
    !/^\+?[0-9\s()-]{10,20}$/.test(contactPhone) ||
    companyName.length > 120 ||
    message.length < 10 ||
    message.length > 2000
  ) {
    return NextResponse.json(
      { error: "Ad soyad, e-posta, telefon ve mesaj zorunludur." },
      { status: 422 },
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Veritabanı bağlantısı yok." },
      { status: 503 },
    );
  }

  const quote = await prisma.quoteRequest.create({
    data: {
      commercialConsentAt: new Date(),
      companyName: companyName || null,
      contactEmail: contactEmail.toLowerCase(),
      contactName,
      contactPhone,
      kvkkAcceptedAt: new Date(),
      note: message,
      source: "seko-front-contact",
      userType: companyName ? "CORPORATE" : "INDIVIDUAL",
    },
  });

  return NextResponse.json({ id: quote.id, ok: true });
}

function text(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}
