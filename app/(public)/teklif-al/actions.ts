"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { quoteRequestSchema } from "@/lib/validations/quote";

export async function createQuoteRequest(formData: FormData) {
  const parsed = quoteRequestSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    redirect("/teklif-al?error=validation");
  }

  const data = parsed.data;

  const quote = await prisma.quoteRequest.create({
    data: {
      commercialConsentAt: data.commercialConsent ? new Date() : null,
      companyName: data.companyName,
      contactEmail: data.contactEmail,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      items: {
        create: {
          annualKm: data.annualKm,
          brandText: data.brandText,
          durationMonths: data.durationMonths,
          modelText: data.modelText,
          quantity: data.quantity,
        },
      },
      kvkkAcceptedAt: new Date(),
      note: data.note,
      source: "web",
      userType: data.userType,
    },
    select: {
      id: true,
    },
  });

  await prisma.consentRecord.create({
    data: {
      acceptedAt: new Date(),
      email: data.contactEmail,
      type: "KVKK",
      version: "2026-06-18",
    },
  });

  redirect(`/teklif-al/basarili?id=${quote.id}`);
}
