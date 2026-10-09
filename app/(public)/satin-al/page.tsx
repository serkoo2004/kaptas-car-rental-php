import Link from "next/link";
import { ArrowLeft, Headphones, LockKeyhole, ShieldCheck } from "lucide-react";
import { startVehiclePurchase } from "@/app/(public)/satin-al/actions";
import { VehicleCheckoutForm } from "@/components/checkout/vehicle-checkout-form";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { getPrimaryLocationName } from "@/lib/locations/primary";
import { getIyzicoConfig } from "@/lib/payments/iyzico";
import {
  convertUsd,
  getExchangeRateSnapshot,
  normalizeCurrency,
  usdConversionRate,
} from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  database: "Ödeme servisine şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar deneyin.",
  iyzico: "3D Secure doğrulaması başlatılamadı. Kart bilgilerinizi kontrol edip tekrar deneyin.",
  "iyzico-config": "Online ödeme servisi şu anda kullanılamıyor.",
  "no-price": "Seçilen araç için online kiralama fiyatı bulunamadı.",
  "not-found": "Seçilen araç artık kiralamaya açık değil.",
  period: "Alış ve bırakış tarihlerini kontrol edin.",
  rate: "Güncel döviz kuru alınamadı. Lütfen kısa süre sonra tekrar deneyin.",
  reservation: "Araç sizin için beklemeye alınamadı. Lütfen tekrar deneyin.",
  unavailable: "Bu araç seçilen tarih aralığında artık müsait değil.",
  validation: "Zorunlu alanları ve kart bilgilerini kontrol edin.",
};

export default async function PurchasePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const vehicleId = valueOf(params.vehicleId);
  const leadId = valueOf(params.leadId) ?? "";
  const error = valueOf(params.error);
  const currency = normalizeCurrency(valueOf(params.currency));
  const databaseReady = await isDatabaseAvailable();
  const session = await getCurrentSession();
  const [vehicle, primaryLocation, account] = await Promise.all([
    vehicleId ? getVehicle(vehicleId, databaseReady) : Promise.resolve(null),
    getPrimaryLocationName(),
    getAccountDefaults(
      session?.user?.status === "ACTIVE" ? session.user.id : undefined,
      databaseReady,
    ),
  ]);
  const baseDailyPriceUsd = Number(vehicle?.dailyPrice ?? 0);
  let dailyPrice = baseDailyPriceUsd;
  let exchangeRateLabel: string | null = currency === "USD" ? "USD taban fiyat" : null;
  let exchangeRateError = false;

  if (baseDailyPriceUsd > 0 && currency !== "USD") {
    try {
      const snapshot = await getExchangeRateSnapshot();
      dailyPrice = convertUsd(baseDailyPriceUsd, currency, snapshot);
      exchangeRateLabel = `1 USD = ${usdConversionRate(currency, snapshot)} ${currency} · ${snapshot.provider} · ${snapshot.asOf}`;
    } catch {
      dailyPrice = 0;
      exchangeRateError = true;
    }
  }
  const isAdmin =
    session?.user?.status === "ACTIVE" &&
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "");

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      <section className="border-b border-[#deded8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-foreground/55 transition hover:text-amber-800" href="/">
              <ArrowLeft className="h-4 w-4" /> Araç seçimine dön
            </Link>
            <h1 className="mt-4 text-3xl font-extrabold text-[#242424] sm:text-4xl">Rezervasyonu Tamamla</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/55">
              Kiralama bilgilerinizi kontrol edin ve ödemenizi iyzico 3D Secure ile güvenle tamamlayın.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-foreground/65">
            <span className="inline-flex h-10 items-center gap-2 border border-[#deded8] bg-white px-3"><LockKeyhole className="h-4 w-4 text-amber-700" /> 256-bit güvenli bağlantı</span>
            <span className="inline-flex h-10 items-center gap-2 border border-[#deded8] bg-white px-3"><ShieldCheck className="h-4 w-4 text-emerald-700" /> 3D Secure ödeme</span>
            <span className="inline-flex h-10 items-center gap-2 border border-[#deded8] bg-white px-3"><Headphones className="h-4 w-4 text-amber-700" /> Destek</span>
          </div>
        </div>
      </section>

      <VehicleCheckoutForm
        account={account}
        action={startVehiclePurchase}
        currency={currency}
        dailyPrice={dailyPrice}
        errorMessage={exchangeRateError
          ? errorMessages.rate
          : error
            ? errorMessages[error] ?? "Ödeme başlatılamadı. Bilgileri kontrol edip tekrar deneyin."
            : null}
        exchangeRateLabel={exchangeRateLabel}
        isAdmin={isAdmin}
        iyzicoReady={getIyzicoConfig().isConfigured}
        leadId={leadId}
        location={primaryLocation}
        rental={{
          dropoffDate: valueOf(params.dropoffDate) ?? "",
          dropoffTime: valueOf(params.dropoffTime) ?? "",
          pickupDate: valueOf(params.pickupDate) ?? "",
          pickupTime: valueOf(params.pickupTime) ?? "",
        }}
        vehicle={vehicle ? {
          brand: vehicle.brand.name,
          id: vehicle.id,
          imageUrl: vehicle.images[0]?.url ?? null,
          model: vehicle.model.name,
          title: vehicle.title,
        } : null}
      />
    </div>
  );
}

async function getVehicle(vehicleId: string, databaseReady: boolean) {
  if (!databaseReady) {
    return null;
  }

  return prisma.vehicle.findFirst({
    include: {
      brand: true,
      images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 },
      model: true,
      packages: { orderBy: [{ monthlyPrice: "asc" }], where: { isActive: true } },
    },
    where: {
      id: vehicleId,
      images: { some: {} },
      isPublishedWeb: true,
      status: "PUBLISHED",
      stockCount: { gt: 0 },
    },
  });
}

async function getAccountDefaults(userId: string | undefined, databaseReady: boolean) {
  if (!userId || !databaseReady) return emptyAccountDefaults();

  const user = await prisma.user.findUnique({
    select: { address: true, city: true, district: true, email: true, name: true, phone: true },
    where: { id: userId },
  });

  return user ? {
    address: user.address ?? "",
    city: user.city ?? "",
    district: user.district ?? "",
    email: user.email,
    name: user.name ?? "",
    phone: user.phone ?? "",
  } : emptyAccountDefaults();
}

function emptyAccountDefaults() {
  return { address: "", city: "", district: "", email: "", name: "", phone: "" };
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
