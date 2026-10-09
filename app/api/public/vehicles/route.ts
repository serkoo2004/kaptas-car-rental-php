import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import {
  convertUsd,
  getExchangeRateSnapshot,
  normalizeCurrency,
  type ExchangeRateSnapshot,
  type SupportedCurrency,
} from "@/lib/exchange-rates";
import { getPublishedVehicles, type VehicleFilters } from "@/lib/vehicles/queries";
import {
  getVehicleAvailabilityCounts,
  parseRentalPeriod,
  RentalPeriodError,
  type RentalPeriod,
} from "@/lib/reservations/availability";

export const dynamic = "force-dynamic";

type DbVehicle = Awaited<ReturnType<typeof getPublishedVehicles>>[number];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const currency = normalizeCurrency(value(url, "currency"));
  let rentalPeriod: RentalPeriod | null = null;
  let exchangeRates: ExchangeRateSnapshot | undefined;
  let availabilityCounts: Map<string, number> | null = null;

  if (currency !== "USD") {
    try {
      exchangeRates = await getExchangeRateSnapshot();
    } catch {
      return NextResponse.json(
        { error: "Güncel döviz kuru alınamadı. Lütfen tekrar deneyin." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (hasRentalPeriod(url)) {
    try {
      rentalPeriod = parseRentalPeriod({
        dropoffDate: value(url, "endDate") ?? "",
        dropoffTime: value(url, "endTime") ?? "",
        pickupDate: value(url, "startDate") ?? "",
        pickupTime: value(url, "startTime") ?? "",
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

  const filters: VehicleFilters = {
    brand: value(url, "brand"),
    durationMonths: value(url, "durationMonths"),
    fuelType: normalizeFuel(value(url, "fuelType")),
    maxMonthlyPrice: value(url, "maxMonthlyPrice"),
    model: value(url, "model"),
    transmission: normalizeTransmission(value(url, "transmission")),
  };

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Araç servisine şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }

  let vehicles: DbVehicle[];

  try {
    vehicles = await getPublishedVehicles(filters);

    if (rentalPeriod) {
      availabilityCounts = await getVehicleAvailabilityCounts(
        vehicles.map((vehicle) => vehicle.id),
        rentalPeriod,
      );
      vehicles = vehicles.filter(
        (vehicle) => (availabilityCounts?.get(vehicle.id) ?? 0) > 0,
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Araçlar yüklenirken beklenmeyen bir hata oluştu." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    availability: rentalPeriod
      ? {
          dropoffAt: rentalPeriod.dropoffAt.toISOString(),
          filtered: true,
          pickupAt: rentalPeriod.pickupAt.toISOString(),
        }
      : { filtered: false },
    currency,
    data: vehicles.map((vehicle) =>
      toFrontVehicle(
        vehicle,
        currency,
        exchangeRates,
        availabilityCounts?.get(vehicle.id) ?? vehicle.stockCount,
      ),
    ),
    exchangeRate: exchangeRates
      ? {
          asOf: exchangeRates.asOf,
          provider: exchangeRates.provider,
          stale: Boolean(exchangeRates.stale),
        }
      : null,
    source: "database",
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function hasRentalPeriod(url: URL) {
  return ["startDate", "startTime", "endDate", "endTime"].some((key) =>
    url.searchParams.has(key),
  );
}

function value(url: URL, key: string) {
  return url.searchParams.get(key)?.trim() || undefined;
}

function normalizeFuel(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLocaleLowerCase("tr-TR");

  if (normalized.includes("lpg")) return "GASOLINE_LPG";
  if (normalized.includes("dizel")) return "DIESEL";
  if (normalized.includes("benzin")) return "GASOLINE";
  if (normalized.includes("elektrik")) return "ELECTRIC";
  if (normalized.includes("hybrid")) return "HYBRID";

  return value;
}

function normalizeTransmission(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLocaleLowerCase("tr-TR");

  if (normalized.includes("otomatik")) return "AUTOMATIC";
  if (normalized.includes("manuel")) return "MANUAL";

  return value;
}

function toFrontVehicle(
  vehicle: DbVehicle,
  currency: SupportedCurrency,
  exchangeRates?: ExchangeRateSnapshot,
  availableCount = vehicle.stockCount,
) {
  const dailyUsd = Number(vehicle.dailyPrice ?? 0);
  const dailyAmount =
    Number.isFinite(dailyUsd) && dailyUsd > 0
      ? convertUsd(dailyUsd, currency, exchangeRates)
      : null;
  const image = vehicle.images[0]?.url;

  return {
    age: String(minimumAge(vehicle)),
    backendId: vehicle.id,
    availableCount,
    capacity: vehicle.bodyType === "Van" ? "4 Kişi" : "5 Kişi",
    canBook: dailyAmount !== null,
    currency,
    dailyPriceAmount: dailyAmount,
    dailyPriceUsd: Number.isFinite(dailyUsd) && dailyUsd > 0 ? dailyUsd : null,
    driveType: vehicle.driveType,
    fuel: translateFuel(vehicle.fuelType),
    features: vehicle.features.map((feature) => ({
      group: feature.group ?? "Donanım",
      label: feature.label,
      value: feature.value,
    })),
    gear: translateTransmission(vehicle.transmission),
    group: vehicle.segment ?? vehicle.bodyType ?? "Ekonomik",
    id: vehicle.id,
    image,
    license: `${minimumLicenseYear(vehicle)} yıl`,
    doors: doorText(vehicle),
    name: `${vehicle.brand.name} ${vehicle.model.name}`,
    specialOffer: vehicle.isFeatured,
    stockCount: vehicle.stockCount,
    type: vehicle.bodyType ?? vehicle.segment ?? "Otomobil",
  };
}

function translateFuel(value: string) {
  const labels: Record<string, string> = {
    DIESEL: "Dizel",
    ELECTRIC: "Elektrikli",
    GASOLINE: "Benzin",
    GASOLINE_LPG: "Benzin + LPG",
    HYBRID: "Hybrid",
  };

  return labels[value] ?? value;
}

function translateTransmission(value: string) {
  const labels: Record<string, string> = {
    AUTOMATIC: "Otomatik",
    MANUAL: "Manuel",
  };

  return labels[value] ?? value;
}

function minimumAge(vehicle: DbVehicle) {
  if ((vehicle.segment ?? "").toLocaleLowerCase("tr-TR").includes("suv")) {
    return 27;
  }

  if ((vehicle.bodyType ?? "").toLocaleLowerCase("tr-TR").includes("van")) {
    return 25;
  }

  return 21;
}

function minimumLicenseYear(vehicle: DbVehicle) {
  return minimumAge(vehicle) >= 25 ? 3 : 1;
}

function doorText(vehicle: DbVehicle) {
  const configuredDoorCount = vehicle.features.find((feature) => {
    const label = feature.label.toLocaleLowerCase("tr-TR");
    return label === "kapı" || label === "kapi" || label === "door" || label === "doors";
  })?.value.match(/\d+/)?.[0];

  return `${configuredDoorCount ?? "5"} Kapı`;
}
