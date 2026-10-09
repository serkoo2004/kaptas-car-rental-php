"use server";

import { QuoteStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { canAccessAdmin } from "@/lib/permissions/rbac";

const quoteStatuses = Object.values(QuoteStatus);

async function requireAdminUserId() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!canAccessAdmin(session.user.role, session.user.status)) {
    redirect("/");
  }

  return session.user.id;
}

export async function updateLeadStatus(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/basvurular?error=database");
  }

  const actorId = await requireAdminUserId();
  const quoteRequestId = String(formData.get("quoteRequestId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as QuoteStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!quoteRequestId || !quoteStatuses.includes(nextStatus)) {
    redirect(`/admin/basvurular/${quoteRequestId}?error=validation`);
  }

  const current = await prisma.quoteRequest.findUnique({
    select: { status: true },
    where: { id: quoteRequestId },
  });

  if (!current) {
    redirect("/admin/basvurular?error=not-found");
  }

  await prisma.$transaction([
    prisma.quoteRequest.update({
      data: { status: nextStatus },
      where: { id: quoteRequestId },
    }),
    prisma.quoteStatusHistory.create({
      data: {
        changedById: actorId,
        fromStatus: current.status,
        note: note || null,
        quoteRequestId,
        toStatus: nextStatus,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "QUOTE_STATUS_CHANGED",
        actorId,
        after: { status: nextStatus },
        before: { status: current.status },
        entityId: quoteRequestId,
        entityType: "QuoteRequest",
      },
    }),
  ]);

  revalidatePath(`/admin/basvurular/${quoteRequestId}`);
}

export async function assignLead(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/basvurular?error=database");
  }

  const actorId = await requireAdminUserId();
  const quoteRequestId = String(formData.get("quoteRequestId") ?? "");
  const salesRepId = String(formData.get("salesRepId") ?? "");
  const note = String(formData.get("assignmentNote") ?? "").trim();

  if (!quoteRequestId) {
    redirect("/admin/basvurular?error=validation");
  }

  await prisma.$transaction([
    prisma.quoteRequest.update({
      data: {
        assignedSalesRepId: salesRepId || null,
      },
      where: { id: quoteRequestId },
    }),
    ...(salesRepId
      ? [
          prisma.leadAssignment.create({
            data: {
              assignedById: actorId,
              note: note || null,
              quoteRequestId,
              salesRepId,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        action: "QUOTE_ASSIGNED",
        actorId,
        after: { assignedSalesRepId: salesRepId || null },
        entityId: quoteRequestId,
        entityType: "QuoteRequest",
      },
    }),
  ]);

  revalidatePath(`/admin/basvurular/${quoteRequestId}`);
}

export async function addLeadNote(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/basvurular?error=database");
  }

  const actorId = await requireAdminUserId();
  const quoteRequestId = String(formData.get("quoteRequestId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!quoteRequestId || body.length < 2) {
    redirect(`/admin/basvurular/${quoteRequestId}?error=validation`);
  }

  await prisma.adminNote.create({
    data: {
      authorId: actorId,
      body,
      isInternal: true,
      quoteRequestId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ADMIN_NOTE_ADDED",
      actorId,
      after: { body },
      entityId: quoteRequestId,
      entityType: "QuoteRequest",
    },
  });

  revalidatePath(`/admin/basvurular/${quoteRequestId}`);
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function positiveInteger(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function decimal(formData: FormData, key: string, fallback = 0) {
  const normalized = text(formData, key).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function serviceList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createLeadOffer(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/basvurular?error=database");
  }

  const actorId = await requireAdminUserId();
  const quoteRequestId = text(formData, "quoteRequestId");
  const title = text(formData, "title") || "Filo kiralama teklifi";
  const status = text(formData, "status") || "DRAFT";
  const validDays = positiveInteger(formData, "validDays", 14);
  const itemIds = formData.getAll("itemId").map((value) => String(value));

  if (!quoteRequestId || itemIds.length === 0) {
    redirect(`/admin/basvurular/${quoteRequestId}?error=offer-validation`);
  }

  const offerItems = itemIds.map((itemId) => {
    const quantity = positiveInteger(formData, `quantity_${itemId}`, 1);
    const monthlyPrice = decimal(formData, `monthlyPrice_${itemId}`, 0);

    return {
      annualKm: positiveInteger(formData, `annualKm_${itemId}`, 20000),
      durationMonths: positiveInteger(formData, `durationMonths_${itemId}`, 36),
      monthlyPrice,
      quantity,
      services: serviceList(text(formData, `services_${itemId}`)),
      vehicleTitle: text(formData, `vehicleTitle_${itemId}`) || "Araç",
    };
  });

  if (offerItems.some((item) => item.monthlyPrice <= 0)) {
    redirect(`/admin/basvurular/${quoteRequestId}?error=offer-price`);
  }

  const totalMonthly = offerItems.reduce(
    (total, item) => total + item.monthlyPrice * item.quantity,
    0,
  );
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  const current = await prisma.quoteRequest.findUnique({
    select: { status: true },
    where: { id: quoteRequestId },
  });

  if (!current) {
    redirect("/admin/basvurular?error=not-found");
  }

  await prisma.$transaction(async (tx) => {
    const offer = await tx.quoteOffer.create({
      data: {
        createdById: actorId,
        currency: "TRY",
        quoteRequestId,
        status,
        title,
        totalMonthly,
        validUntil,
        items: {
          create: offerItems.map((item) => ({
            annualKm: item.annualKm,
            durationMonths: item.durationMonths,
            monthlyPrice: item.monthlyPrice,
            quantity: item.quantity,
            services: item.services,
            vehicleTitle: item.vehicleTitle,
          })),
        },
      },
    });

    const nextStatus: QuoteStatus =
      status === "SENT" ? "OFFER_SENT" : "PREPARING_OFFER";

    await tx.quoteRequest.update({
      data: { status: nextStatus },
      where: { id: quoteRequestId },
    });

    await tx.quoteStatusHistory.create({
      data: {
        changedById: actorId,
        fromStatus: current.status,
        note: `${title} oluşturuldu. Aylık toplam: ${totalMonthly.toLocaleString("tr-TR")} TL`,
        quoteRequestId,
        toStatus: nextStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "QUOTE_OFFER_CREATED",
        actorId,
        after: { offerId: offer.id, status, totalMonthly },
        entityId: offer.id,
        entityType: "QuoteOffer",
      },
    });
  });

  revalidatePath(`/admin/basvurular/${quoteRequestId}`);
  revalidatePath("/admin/teklifler");
  revalidatePath("/admin/basvurular");
}
