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
    redirect("/login?callbackUrl=/admin/rezervasyonlar");
  }

  if (!canAccessAdmin(session.user.role, session.user.status)) {
    redirect("/");
  }

  return session.user.id;
}

export async function cancelReservation(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/rezervasyonlar?error=database");
  }

  const actorId = await requireAdminUserId();
  const id = String(formData.get("id") ?? "").trim();
  const current = await prisma.reservation.findUnique({ where: { id } });

  if (!current) {
    redirect("/admin/rezervasyonlar?error=not-found");
  }

  if (!(["HOLD", "CONFIRMED"] as string[]).includes(current.status)) {
    redirect("/admin/rezervasyonlar?error=not-active");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.reservation.update({
      data: {
        cancellationNote: "Admin tarafından iptal edildi.",
        holdExpiresAt: null,
        status: "CANCELLED",
      },
      where: { id: current.id },
    });

    if (current.paymentIntentId) {
      await transaction.paymentIntent.updateMany({
        data: { status: "CANCELLED" },
        where: {
          id: current.paymentIntentId,
          status: { in: ["PENDING", "AUTHORIZED"] },
        },
      });
    }

    await transaction.auditLog.create({
      data: {
        action: "RESERVATION_CANCELLED",
        actorId,
        before: JSON.parse(JSON.stringify(current)),
        entityId: current.id,
        entityType: "Reservation",
      },
    });
  });

  revalidatePath("/admin/rezervasyonlar");
  revalidatePath("/arac-filosu");
}
