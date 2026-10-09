"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { canAccessAdmin } from "@/lib/permissions/rbac";

async function requireAdminUserId() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/belgeler");
  }

  if (!canAccessAdmin(session.user.role, session.user.status)) {
    redirect("/");
  }

  return session.user.id;
}

export async function approveDocument(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/belgeler?error=database");
  }

  const actorId = await requireAdminUserId();
  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) {
    redirect("/admin/belgeler?error=validation");
  }

  await prisma.$transaction([
    prisma.document.update({
      data: {
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedById: actorId,
        status: "APPROVED",
      },
      where: { id: documentId },
    }),
    prisma.auditLog.create({
      data: {
        action: "DOCUMENT_APPROVED",
        actorId,
        after: { status: "APPROVED" },
        entityId: documentId,
        entityType: "Document",
      },
    }),
  ]);

  revalidatePath("/admin/belgeler");
}

export async function rejectDocument(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/belgeler?error=database");
  }

  const actorId = await requireAdminUserId();
  const documentId = String(formData.get("documentId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!documentId) {
    redirect("/admin/belgeler?error=validation");
  }

  await prisma.$transaction([
    prisma.document.update({
      data: {
        rejectionReason: rejectionReason || "Belge tekrar yuklenmeli.",
        reviewedAt: new Date(),
        reviewedById: actorId,
        status: "REJECTED",
      },
      where: { id: documentId },
    }),
    prisma.auditLog.create({
      data: {
        action: "DOCUMENT_REJECTED",
        actorId,
        after: { rejectionReason, status: "REJECTED" },
        entityId: documentId,
        entityType: "Document",
      },
    }),
  ]);

  revalidatePath("/admin/belgeler");
}
