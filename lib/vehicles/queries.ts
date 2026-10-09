import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type VehicleFilters = {
  brand?: string;
  model?: string;
  fuelType?: string;
  transmission?: string;
  maxMonthlyPrice?: string;
  durationMonths?: string;
};

export async function getPublishedVehicles(filters: VehicleFilters) {
  const where: Prisma.VehicleWhereInput = {
    isPublishedWeb: true,
    images: { some: {} },
    stockCount: { gt: 0 },
    status: "PUBLISHED",
  };

  if (filters.brand) {
    where.brand = {
      name: {
        contains: filters.brand,
      },
    };
  }

  if (filters.model) {
    where.model = {
      name: {
        contains: filters.model,
      },
    };
  }

  if (filters.fuelType) {
    where.fuelType = filters.fuelType as Prisma.EnumFuelTypeFilter<"Vehicle">;
  }

  if (filters.transmission) {
    where.transmission =
      filters.transmission as Prisma.EnumTransmissionTypeFilter<"Vehicle">;
  }

  if (filters.maxMonthlyPrice) {
    const maxPrice = Number(filters.maxMonthlyPrice);

    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      where.monthlyPriceFrom = {
        lte: maxPrice,
      };
    }
  }

  if (filters.durationMonths) {
    const duration = Number(filters.durationMonths);

    if (!Number.isNaN(duration) && duration > 0) {
      where.packages = {
        some: {
          durationMonths: duration,
          isActive: true,
        },
      };
    }
  }

  return prisma.vehicle.findMany({
    include: {
      brand: true,
      features: {
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
      model: true,
      packages: {
        orderBy: [{ durationMonths: "asc" }, { annualKm: "asc" }],
        take: 1,
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    where,
  });
}

export async function getPublishedVehicleBySlug(slug: string) {
  return prisma.vehicle.findFirst({
    include: {
      brand: true,
      features: {
        orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      },
      model: true,
      packages: {
        orderBy: [{ durationMonths: "asc" }, { annualKm: "asc" }],
        where: { isActive: true },
      },
    },
    where: {
      isPublishedWeb: true,
      slug,
      status: "PUBLISHED",
    },
  });
}
