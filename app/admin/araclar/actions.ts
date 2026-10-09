"use server";

import {
  DeliveryStatus,
  DriveType,
  FuelType,
  TransmissionType,
  VehicleStatus,
} from "@prisma/client";
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

const fuelTypes = Object.values(FuelType);
const driveTypes = Object.values(DriveType);
const transmissionTypes = Object.values(TransmissionType);
const deliveryStatuses = Object.values(DeliveryStatus);
const vehicleStatuses = Object.values(VehicleStatus);

async function requireAdminUserId() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
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
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function decimalText(formData: FormData, key: string) {
  const rawValue = text(formData, key);
  const value = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : null;
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

function featuresFromTextarea(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.indexOf(":");

      if (separator === -1) {
        return { label: item, value: "Standart" };
      }

      const label = item.slice(0, separator).trim();
      const featureValue = item.slice(separator + 1).trim();

      return {
        label,
        value: featureValue || "Standart",
      };
    })
    .filter((item) => item.label.length > 0);
}

async function getOrCreateBrandAndModel({
  brandName,
  modelName,
  segment,
  bodyType,
}: {
  brandName: string;
  modelName: string;
  segment: string | null;
  bodyType: string | null;
}) {
  const brandSlug = slugify(brandName);
  const modelSlug = slugify(modelName);

  const brand = await prisma.vehicleBrand.upsert({
    create: {
      name: brandName,
      slug: brandSlug,
    },
    update: {
      isActive: true,
      name: brandName,
    },
    where: {
      slug: brandSlug,
    },
  });

  const model = await prisma.vehicleModel.upsert({
    create: {
      bodyType,
      brandId: brand.id,
      name: modelName,
      segment,
      slug: modelSlug,
    },
    update: {
      bodyType,
      isActive: true,
      name: modelName,
      segment,
    },
    where: {
      brandId_slug: {
        brandId: brand.id,
        slug: modelSlug,
      },
    },
  });

  return { brand, model };
}

async function minimumStockForActiveReservations(vehicleId: string) {
  const now = new Date();
  const reservations = await prisma.reservation.findMany({
    select: { dropoffAt: true, pickupAt: true },
    where: {
      dropoffAt: { gt: now },
      vehicleId,
      OR: [
        { status: "CONFIRMED" },
        { holdExpiresAt: { gt: now }, status: "HOLD" },
      ],
    },
  });
  const events = reservations.flatMap((reservation) => [
    { change: 1, time: reservation.pickupAt.getTime() },
    { change: -1, time: reservation.dropoffAt.getTime() },
  ]);

  events.sort((left, right) => left.time - right.time || left.change - right.change);

  let active = 0;
  let required = 0;

  for (const event of events) {
    active += event.change;
    required = Math.max(required, active);
  }

  return required;
}

export async function createVehicle(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar/yeni?error=database");
  }

  const actorId = await requireAdminUserId();
  const brandName = text(formData, "brandName");
  const modelName = text(formData, "modelName");
  const title = text(formData, "title");
  const fuelType = text(formData, "fuelType") as FuelType;
  const transmission = text(formData, "transmission") as TransmissionType;
  const driveTypeText = text(formData, "driveType");
  const driveType = driveTypeText ? (driveTypeText as DriveType) : null;
  const deliveryStatus = text(formData, "deliveryStatus") as DeliveryStatus;
  const status = text(formData, "status") as VehicleStatus;
  const dailyPrice = decimalText(formData, "dailyPrice");
  const isPublishedWeb = checkbox(formData, "isPublishedWeb");
  const isPublishedMobile = checkbox(formData, "isPublishedMobile");
  const effectiveStatus =
    isPublishedWeb && status === "DRAFT" ? VehicleStatus.PUBLISHED : status;
  const stockCount = integer(formData, "stockCount") ?? 0;
  let imageFiles: File[] = [];

  try {
    imageFiles = vehicleImageFiles(formData);
  } catch {
    redirect("/admin/araclar/yeni?error=image-validation");
  }

  if (
    !brandName ||
    !modelName ||
    !title ||
    !fuelTypes.includes(fuelType) ||
    !transmissionTypes.includes(transmission) ||
    (driveType !== null && !driveTypes.includes(driveType)) ||
    !deliveryStatuses.includes(deliveryStatus) ||
    !vehicleStatuses.includes(status) ||
    !dailyPrice ||
    stockCount < 0 ||
    (isPublishedWeb && imageFiles.length === 0)
  ) {
    redirect("/admin/araclar/yeni?error=validation");
  }

  const segment = optionalText(formData, "segment");
  const bodyType = optionalText(formData, "bodyType");
  const { brand, model } = await getOrCreateBrandAndModel({
    bodyType,
    brandName,
    modelName,
    segment,
  });

  const baseSlug = slugify(`${brandName}-${modelName}-${title}`);
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
  const featureItems = featuresFromTextarea(text(formData, "features"));

  const vehicle = await prisma.vehicle.create({
    data: {
      batteryRange: optionalText(formData, "batteryRange"),
      bodyType,
      brandId: brand.id,
      consumption: optionalText(formData, "consumption"),
      deliveryStatus,
      driveType,
      enginePower: optionalText(formData, "enginePower"),
      fuelType,
      isFeatured: checkbox(formData, "isFeatured"),
      isPublishedMobile,
      isPublishedWeb,
      modelId: model.id,
      dailyPrice,
      depositAmount: null,
      segment,
      seoDescription: optionalText(formData, "seoDescription"),
      seoTitle: optionalText(formData, "seoTitle"),
      slug: uniqueSlug,
      status: effectiveStatus,
      stockCount,
      title,
      transmission,
      year: integer(formData, "year"),
      features:
        featureItems.length > 0
          ? {
              create: featureItems.map((feature, index) => ({
                group: "Donanım",
                label: feature.label,
                sortOrder: index,
                value: feature.value,
              })),
            }
          : undefined,
      monthlyPriceFrom: null,
    },
  });

  if (imageFiles.length > 0) {
    let storedImages: StoredVehicleImage[] = [];

    try {
      storedImages = await storeVehicleImages(vehicle.id, imageFiles);
      await prisma.vehicleImage.createMany({
        data: storedImages.map((image, index) => ({
          alt: title,
          isCover: index === 0,
          sortOrder: index,
          url: image.url,
          vehicleId: vehicle.id,
        })),
      });
    } catch {
      await Promise.all(storedImages.map((image) => removeStoredVehicleImage(image.url)));
      await prisma.vehicle.delete({ where: { id: vehicle.id } }).catch(() => null);
      redirect("/admin/araclar/yeni?error=image-upload");
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "VEHICLE_CREATED",
      actorId,
      after: { title, vehicleId: vehicle.id },
      entityId: vehicle.id,
      entityType: "Vehicle",
    },
  });

  revalidatePath("/admin/araclar");
  revalidatePath("/araclar");
  revalidatePath("/");
  revalidatePath("/arac-filosu");
  revalidatePath("/api/public/vehicles");
  redirect(`/admin/araclar/${vehicle.id}`);
}

export async function updateVehicle(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");
  const brandName = text(formData, "brandName");
  const modelName = text(formData, "modelName");
  const title = text(formData, "title");
  const fuelType = text(formData, "fuelType") as FuelType;
  const transmission = text(formData, "transmission") as TransmissionType;
  const driveTypeText = text(formData, "driveType");
  const driveType = driveTypeText ? (driveTypeText as DriveType) : null;
  const deliveryStatus = text(formData, "deliveryStatus") as DeliveryStatus;
  const status = text(formData, "status") as VehicleStatus;
  const isPublishedWeb = checkbox(formData, "isPublishedWeb");
  const isPublishedMobile = checkbox(formData, "isPublishedMobile");
  const effectiveStatus =
    isPublishedWeb && status === "DRAFT" ? VehicleStatus.PUBLISHED : status;
  const stockCount = integer(formData, "stockCount") ?? 0;
  const dailyPrice = decimalText(formData, "dailyPrice");

  if (
    !vehicleId ||
    !brandName ||
    !modelName ||
    !title ||
    !fuelTypes.includes(fuelType) ||
    !transmissionTypes.includes(transmission) ||
    (driveType !== null && !driveTypes.includes(driveType)) ||
    !deliveryStatuses.includes(deliveryStatus) ||
    !vehicleStatuses.includes(status) ||
    stockCount < 0 ||
    !dailyPrice
  ) {
    redirect(`/admin/araclar/${vehicleId}?error=validation`);
  }

  const segment = optionalText(formData, "segment");
  const bodyType = optionalText(formData, "bodyType");
  const featureItems = featuresFromTextarea(text(formData, "features"));
  const imageCount = await prisma.vehicleImage.count({ where: { vehicleId } });

  if (isPublishedWeb && imageCount === 0) {
    redirect(`/admin/araclar/${vehicleId}?error=publish-requires-image`);
  }

  const minimumStock = await minimumStockForActiveReservations(vehicleId);

  if (stockCount < minimumStock) {
    redirect(`/admin/araclar/${vehicleId}?error=stock-below-reservations`);
  }
  const { brand, model } = await getOrCreateBrandAndModel({
    bodyType,
    brandName,
    modelName,
    segment,
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.vehicle.update({
      data: {
        batteryRange: optionalText(formData, "batteryRange"),
        bodyType,
        brandId: brand.id,
        consumption: optionalText(formData, "consumption"),
        dailyPrice,
        depositAmount: null,
        deliveryStatus,
        driveType,
        enginePower: optionalText(formData, "enginePower"),
        fuelType,
        isFeatured: checkbox(formData, "isFeatured"),
        isPublishedMobile,
        isPublishedWeb,
        modelId: model.id,
        monthlyPriceFrom: null,
        segment,
        seoDescription: optionalText(formData, "seoDescription"),
        seoTitle: optionalText(formData, "seoTitle"),
        status: effectiveStatus,
        stockCount,
        title,
        transmission,
        year: integer(formData, "year"),
      },
      where: { id: vehicleId },
    });

    await transaction.vehicleFeature.deleteMany({ where: { vehicleId } });
    await transaction.vehiclePackage.deleteMany({ where: { vehicleId } });
    if (featureItems.length > 0) {
      await transaction.vehicleFeature.createMany({
        data: featureItems.map((feature, index) => ({
          group: "Donanım",
          label: feature.label,
          sortOrder: index,
          value: feature.value,
          vehicleId,
        })),
      });
    }

    await transaction.auditLog.create({
      data: {
        action: "VEHICLE_UPDATED",
        actorId,
        after: { title, status: effectiveStatus },
        entityId: vehicleId,
        entityType: "Vehicle",
      },
    });
  });

  revalidatePath(`/admin/araclar/${vehicleId}`);
  revalidatePath("/admin/araclar");
  revalidatePath("/");
  revalidatePath("/arac-filosu");
  revalidatePath("/api/public/vehicles");
  redirect(`/admin/araclar/${vehicleId}?saved=vehicle`);
}

export async function uploadVehicleImages(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");
  let files: File[] = [];

  try {
    files = vehicleImageFiles(formData, "images", { required: true });
  } catch {
    redirect(`/admin/araclar/${vehicleId}?error=image-validation`);
  }

  const vehicle = await prisma.vehicle.findUnique({
    select: {
      _count: { select: { images: true } },
      images: { orderBy: { sortOrder: "desc" }, select: { sortOrder: true }, take: 1 },
      title: true,
    },
    where: { id: vehicleId },
  });

  if (!vehicle) {
    redirect("/admin/araclar?error=not_found");
  }

  if (vehicle._count.images + files.length > 20) {
    redirect(`/admin/araclar/${vehicleId}?error=image-limit`);
  }

  let storedImages: StoredVehicleImage[] = [];

  try {
    storedImages = await storeVehicleImages(vehicleId, files);
    const firstSortOrder = (vehicle.images[0]?.sortOrder ?? -1) + 1;

    await prisma.$transaction(async (transaction) => {
      await transaction.vehicleImage.createMany({
        data: storedImages.map((image, index) => ({
          alt: vehicle.title,
          isCover: vehicle._count.images === 0 && index === 0,
          sortOrder: firstSortOrder + index,
          url: image.url,
          vehicleId,
        })),
      });
      await transaction.auditLog.create({
        data: {
          action: "VEHICLE_IMAGES_UPLOADED",
          actorId,
          after: { count: storedImages.length },
          entityId: vehicleId,
          entityType: "Vehicle",
        },
      });
    });
  } catch {
    await Promise.all(storedImages.map((image) => removeStoredVehicleImage(image.url)));
    redirect(`/admin/araclar/${vehicleId}?error=image-upload`);
  }

  revalidateVehicleCatalog(vehicleId);
  redirect(`/admin/araclar/${vehicleId}?saved=images`);
}

export async function updateVehicleImage(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");
  const imageId = text(formData, "imageId");
  const sortOrder = Math.max(0, integer(formData, "sortOrder") ?? 0);
  let replacementFiles: File[] = [];

  try {
    replacementFiles = vehicleImageFiles(formData, "replacementImage", { single: true });
  } catch {
    redirect(`/admin/araclar/${vehicleId}?error=image-validation`);
  }

  const image = await prisma.vehicleImage.findFirst({
    include: { vehicle: { select: { title: true } } },
    where: { id: imageId, vehicleId },
  });

  if (!image) {
    redirect(`/admin/araclar/${vehicleId}?error=image-not-found`);
  }

  let replacement: StoredVehicleImage | null = null;

  try {
    replacement = replacementFiles.length
      ? (await storeVehicleImages(vehicleId, replacementFiles))[0]
      : null;
    await prisma.$transaction(async (transaction) => {
      await transaction.vehicleImage.update({
        data: {
          alt: optionalText(formData, "alt") ?? image.vehicle.title,
          sortOrder,
          url: replacement?.url ?? image.url,
        },
        where: { id: image.id },
      });
      await transaction.auditLog.create({
        data: {
          action: "VEHICLE_IMAGE_UPDATED",
          actorId,
          after: { imageId: image.id, replaced: Boolean(replacement), sortOrder },
          entityId: vehicleId,
          entityType: "Vehicle",
        },
      });
    });
  } catch {
    if (replacement) {
      await removeStoredVehicleImage(replacement.url);
    }
    redirect(`/admin/araclar/${vehicleId}?error=image-upload`);
  }

  if (replacement) {
    await removeStoredVehicleImage(image.url);
  }

  revalidateVehicleCatalog(vehicleId);
  redirect(`/admin/araclar/${vehicleId}?saved=image`);
}

export async function setVehicleCoverImage(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");
  const imageId = text(formData, "imageId");
  const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } });

  if (!image) {
    redirect(`/admin/araclar/${vehicleId}?error=image-not-found`);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.vehicleImage.updateMany({
      data: { isCover: false },
      where: { vehicleId },
    });
    await transaction.vehicleImage.update({
      data: { isCover: true },
      where: { id: imageId },
    });
    await transaction.auditLog.create({
      data: {
        action: "VEHICLE_COVER_IMAGE_CHANGED",
        actorId,
        after: { imageId },
        entityId: vehicleId,
        entityType: "Vehicle",
      },
    });
  });

  revalidateVehicleCatalog(vehicleId);
  redirect(`/admin/araclar/${vehicleId}?saved=cover`);
}

export async function deleteVehicleImage(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");
  const imageId = text(formData, "imageId");
  const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } });

  if (!image) {
    redirect(`/admin/araclar/${vehicleId}?error=image-not-found`);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.vehicleImage.delete({ where: { id: image.id } });

    if (image.isCover) {
      const nextCover = await transaction.vehicleImage.findFirst({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        where: { vehicleId },
      });

      if (nextCover) {
        await transaction.vehicleImage.update({
          data: { isCover: true },
          where: { id: nextCover.id },
        });
      }
    }

    await transaction.auditLog.create({
      data: {
        action: "VEHICLE_IMAGE_DELETED",
        actorId,
        before: { imageId: image.id, url: image.url },
        entityId: vehicleId,
        entityType: "Vehicle",
      },
    });
  });

  await removeStoredVehicleImage(image.url);
  revalidateVehicleCatalog(vehicleId);
  redirect(`/admin/araclar/${vehicleId}?saved=image-deleted`);
}

export async function deleteVehicle(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/admin/araclar?error=database");
  }

  const actorId = await requireAdminUserId();
  const vehicleId = text(formData, "vehicleId");

  if (!vehicleId) {
    redirect("/admin/araclar?error=validation");
  }

  const vehicle = await prisma.vehicle.findUnique({
    include: {
      brand: { select: { name: true } },
      images: { select: { url: true } },
      model: { select: { name: true } },
      _count: { select: { reservations: true } },
    },
    where: { id: vehicleId },
  });

  if (!vehicle) {
    redirect("/admin/araclar?error=not_found");
  }

  if (vehicle._count.reservations > 0) {
    redirect("/admin/araclar?error=vehicle_has_reservations");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const quoteItems = await transaction.quoteRequestItem.findMany({
        select: { brandText: true, id: true, modelText: true },
        where: { vehicleId },
      });

      for (const item of quoteItems) {
        await transaction.quoteRequestItem.update({
          data: {
            brandText: item.brandText ?? vehicle.brand.name,
            modelText: item.modelText ?? vehicle.model.name,
            vehicleId: null,
          },
          where: { id: item.id },
        });
      }

      await transaction.customerActivity.updateMany({
        data: { vehicleId: null },
        where: { vehicleId },
      });

      await transaction.vehicle.delete({ where: { id: vehicleId } });

      await transaction.auditLog.create({
        data: {
          action: "VEHICLE_DELETED",
          actorId,
          before: {
            slug: vehicle.slug,
            title: vehicle.title,
          },
          entityId: vehicleId,
          entityType: "Vehicle",
        },
      });
    });
  } catch {
    redirect("/admin/araclar?error=delete_failed");
  }

  await Promise.all(vehicle.images.map((image) => removeStoredVehicleImage(image.url)));

  revalidatePath("/admin/araclar");
  revalidatePath("/");
  revalidatePath("/arac-filosu");
  revalidatePath("/api/public/vehicles");
  redirect("/admin/araclar?deleted=1");
}

function revalidateVehicleCatalog(vehicleId: string) {
  revalidatePath(`/admin/araclar/${vehicleId}`);
  revalidatePath("/admin/araclar");
  revalidatePath("/");
  revalidatePath("/arac-filosu");
  revalidatePath("/api/public/vehicles");
}
