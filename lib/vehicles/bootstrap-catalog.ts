import bootstrapData from "@/prisma/bootstrap-data.json";
import type { VehicleFilters } from "@/lib/vehicles/queries";

type BootstrapVehicle = (typeof bootstrapData.vehicles)[number];

export type CatalogVehicle = {
  id: string;
  brand: { name: string };
  model: { name: string };
  title: string;
  slug: string;
  year: number;
  fuelType: string;
  transmission: string;
  bodyType: string | null;
  segment: string | null;
  enginePower: string | null;
  batteryRange: string | null;
  consumption: string | null;
  monthlyPriceFrom: number | null;
  deliveryStatus: string;
  stockCount: number;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; alt: string | null; isCover: boolean }>;
  packages: Array<{
    id: string;
    name: string | null;
    durationMonths: number;
    annualKm: number;
    monthlyPrice: number;
    includedServices: string[];
  }>;
  features: Array<{
    id: string;
    label: string;
    value: string;
    group: string | null;
  }>;
};

export function getBootstrapVehicles(filters: VehicleFilters = {}) {
  return bootstrapData.vehicles
    .filter((vehicle) => matchesFilters(vehicle, filters))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .map(toCatalogVehicle);
}

export function getBootstrapVehicleBySlug(slug: string) {
  const vehicle = bootstrapData.vehicles.find((item) => item.slug === slug);

  return vehicle ? toCatalogVehicle(vehicle) : null;
}

export function getBootstrapServices() {
  return bootstrapData.services.map((service, index) => ({
    id: `bootstrap-service-${index + 1}`,
    ...service,
  }));
}

export function getBootstrapBlogPosts() {
  return bootstrapData.blogPosts.map((post, index) => ({
    id: `bootstrap-post-${index + 1}`,
    category:
      bootstrapData.blogCategories.find(
        (category) => category.slug === post.categorySlug,
      ) ?? null,
    ...post,
  }));
}

function matchesFilters(vehicle: BootstrapVehicle, filters: VehicleFilters) {
  if (
    filters.brand &&
    !vehicle.brand.toLocaleLowerCase("tr-TR").includes(
      filters.brand.toLocaleLowerCase("tr-TR"),
    )
  ) {
    return false;
  }

  if (
    filters.model &&
    !vehicle.model.toLocaleLowerCase("tr-TR").includes(
      filters.model.toLocaleLowerCase("tr-TR"),
    )
  ) {
    return false;
  }

  if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
    return false;
  }

  if (filters.transmission && vehicle.transmission !== filters.transmission) {
    return false;
  }

  if (filters.maxMonthlyPrice) {
    const maxPrice = Number(filters.maxMonthlyPrice);

    if (!Number.isNaN(maxPrice) && vehicle.monthlyPriceFrom > maxPrice) {
      return false;
    }
  }

  if (filters.durationMonths) {
    const duration = Number(filters.durationMonths);

    if (
      !Number.isNaN(duration) &&
      !vehicle.packages.some((item) => item.durationMonths === duration)
    ) {
      return false;
    }
  }

  return true;
}

function toCatalogVehicle(vehicle: BootstrapVehicle): CatalogVehicle {
  return {
    id: `bootstrap-${vehicle.slug}`,
    batteryRange: vehicle.batteryRange,
    bodyType: vehicle.bodyType,
    brand: { name: vehicle.brand },
    consumption: vehicle.consumption,
    deliveryStatus: vehicle.deliveryStatus,
    enginePower: vehicle.enginePower,
    features: vehicle.features.map(([label, value, group], index) => ({
      id: `${vehicle.slug}-feature-${index + 1}`,
      group,
      label,
      value,
    })),
    fuelType: vehicle.fuelType,
    images: [
      {
        id: `${vehicle.slug}-image`,
        alt: vehicle.imageAlt,
        isCover: true,
        url: vehicle.imageUrl,
      },
    ],
    isFeatured: vehicle.isFeatured,
    model: { name: vehicle.model },
    monthlyPriceFrom: vehicle.monthlyPriceFrom,
    packages: vehicle.packages.map((item, index) => ({
      id: `${vehicle.slug}-package-${index + 1}`,
      annualKm: item.annualKm,
      durationMonths: item.durationMonths,
      includedServices: [
        "Periyodik bakim",
        "Lastik yonetimi",
        "Sigorta ve hasar koordinasyonu",
      ],
      monthlyPrice: item.monthlyPrice,
      name: item.name,
    })),
    segment: vehicle.segment,
    slug: vehicle.slug,
    stockCount: vehicle.stockCount,
    title: vehicle.title,
    transmission: vehicle.transmission,
    year: vehicle.year,
  };
}
