"use server";

import type { BranchLocation } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { canAccessAdmin } from "@/lib/permissions/rbac";
import {
  removeStoredVehicleImage,
  storeVehicleImages,
  vehicleImageFiles,
  type StoredVehicleImage,
} from "@/lib/uploads/vehicle-images";

async function requireAdminUserId() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/subeler");
  }

  if (!canAccessAdmin(session.user.role, session.user.status)) {
    redirect("/");
  }

  return session.user.id;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function integer(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratingValue(formData: FormData) {
  const value = text(formData, "rating").replace(",", ".");
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
    return null;
  }

  return parsed.toFixed(1);
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSlug(name: string, currentId?: string) {
  const base = slugify(name) || "sube";
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.branchLocation.findUnique({ where: { slug } });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function snapshot(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function parseBranchForm(formData: FormData) {
  const name = text(formData, "name");
  const address = text(formData, "address");
  const type = text(formData, "type");

  if (!name || !address || !["city", "airport", "delivery"].includes(type)) {
    redirect("/admin/subeler?error=validation");
  }

  return {
    address,
    city: optionalText(formData, "city"),
    district: optionalText(formData, "district"),
    email: optionalText(formData, "email"),
    isActive: checkbox(formData, "isActive"),
    name,
    phone: optionalText(formData, "phone"),
    rating: ratingValue(formData),
    sortOrder: integer(formData, "sortOrder"),
    subtitle: optionalText(formData, "subtitle"),
    type,
  };
}

export async function createBranchLocation(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/subeler?error=database");
  }

  const actorId = await requireAdminUserId();
  const data = parseBranchForm(formData);
  let imageFiles: File[] = [];

  try {
    imageFiles = vehicleImageFiles(formData, "image", { single: true });
  } catch {
    redirect("/admin/subeler?error=image-validation");
  }

  const branch = await prisma.branchLocation.create({
    data: {
      ...data,
      slug: await uniqueSlug(data.name),
    },
  });

  let storedImage: StoredVehicleImage | null = null;

  if (imageFiles.length) {
    try {
      storedImage = (await storeVehicleImages(`branch-${branch.id}`, imageFiles))[0];
      await prisma.branchLocation.update({
        data: { imageUrl: storedImage.url },
        where: { id: branch.id },
      });
    } catch {
      if (storedImage) {
        await removeStoredVehicleImage(storedImage.url);
      }
      await prisma.branchLocation.delete({ where: { id: branch.id } }).catch(() => null);
      redirect("/admin/subeler?error=image-upload");
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "BRANCH_CREATED",
      actorId,
      after: data,
      entityId: branch.id,
      entityType: "BranchLocation",
    },
  });

  revalidatePath("/admin/subeler");
  revalidatePath("/lokasyonlar");
  revalidatePath("/api/public/locations");
}

export async function updateBranchLocation(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/subeler?error=database");
  }

  const actorId = await requireAdminUserId();
  const id = text(formData, "id");
  const current = await prisma.branchLocation.findUnique({ where: { id } });

  if (!current) {
    redirect("/admin/subeler?error=not_found");
  }

  const data = parseBranchForm(formData);
  let imageFiles: File[] = [];

  try {
    imageFiles = vehicleImageFiles(formData, "image", { single: true });
  } catch {
    redirect("/admin/subeler?error=image-validation");
  }

  let storedImage: StoredVehicleImage | null = null;
  let branch: BranchLocation;

  try {
    storedImage = imageFiles.length
      ? (await storeVehicleImages(`branch-${id}`, imageFiles))[0]
      : null;
    branch = await prisma.branchLocation.update({
      data: {
        ...data,
        imageUrl: storedImage?.url ?? current.imageUrl,
        slug: await uniqueSlug(data.name, id),
      },
      where: { id },
    });
  } catch {
    if (storedImage) {
      await removeStoredVehicleImage(storedImage.url);
    }
    redirect("/admin/subeler?error=image-upload");
  }

  if (storedImage && current.imageUrl) {
    await removeStoredVehicleImage(current.imageUrl);
  }

  await prisma.auditLog.create({
    data: {
      action: "BRANCH_UPDATED",
      actorId,
      before: snapshot(current),
      after: snapshot(branch),
      entityId: branch.id,
      entityType: "BranchLocation",
    },
  });

  revalidatePath("/admin/subeler");
  revalidatePath("/lokasyonlar");
  revalidatePath("/api/public/locations");
}

export async function setBranchLocationStatus(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/subeler?error=database");
  }

  const actorId = await requireAdminUserId();
  const id = text(formData, "id");
  const isActive = text(formData, "isActive") === "true";
  const current = await prisma.branchLocation.findUnique({ where: { id } });

  if (!current) {
    redirect("/admin/subeler?error=not_found");
  }

  const branch = await prisma.branchLocation.update({
    data: { isActive },
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      action: isActive ? "BRANCH_ACTIVATED" : "BRANCH_DEACTIVATED",
      actorId,
      before: snapshot(current),
      after: snapshot(branch),
      entityId: branch.id,
      entityType: "BranchLocation",
    },
  });

  revalidatePath("/admin/subeler");
  revalidatePath("/lokasyonlar");
  revalidatePath("/api/public/locations");
}
