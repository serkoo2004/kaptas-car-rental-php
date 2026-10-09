import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import {
  getBootstrapVehicleBySlug,
  type CatalogVehicle,
} from "@/lib/vehicles/bootstrap-catalog";
import { getPublishedVehicleBySlug } from "@/lib/vehicles/queries";

export const dynamic = "force-dynamic";

type DbVehicle = NonNullable<Awaited<ReturnType<typeof getPublishedVehicleBySlug>>>;
type VehicleDetail = DbVehicle | CatalogVehicle;

const steps = [
  "Arac ve paket secimi",
  "Teklif hazirlama",
  "Belge onayi",
  "Teslimat planlama",
];

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let vehicle: VehicleDetail | null = null;

  if (await isDatabaseAvailable()) {
    try {
      vehicle = await getPublishedVehicleBySlug(slug);
    } catch {
      vehicle = null;
    }
  }

  vehicle ??= getBootstrapVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const cover = vehicle.images[0];

  return (
    <div className="bg-background">
      <section className="border-b bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Button
            asChild
            className="border-white/18 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            variant="outline"
          >
            <Link href="/araclar">
              <ArrowLeft className="h-4 w-4" />
              Araclara don
            </Link>
          </Button>
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="animate-reveal-up">
            <p className="text-sm font-semibold text-accent">
              {vehicle.brand.name} / {vehicle.model.name}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              {vehicle.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/66">
              {vehicle.segment ?? vehicle.bodyType} segmentinde, operasyonel
              kiralama paketleriyle tekliflendirilebilir. Sure, kilometre ve
              hizmet kapsami teklif akisi icinde netlesir.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroSpec icon={CarFront} label="Gövde" value={vehicle.bodyType ?? "Filo"} />
              <HeroSpec icon={Gauge} label="Tuketim" value={vehicle.consumption ?? "Paketli"} />
              <HeroSpec icon={CalendarDays} label="Yil" value={String(vehicle.year)} />
            </div>
          </div>

          <div className="animate-soft-scale">
            <div className="relative overflow-hidden rounded-lg border border-white/12 bg-white/[0.06] shadow-2xl">
              {cover ? (
                <Image
                  alt={cover.alt ?? vehicle.title}
                  className="h-[360px] w-full object-cover sm:h-[500px]"
                  height={720}
                  priority
                  src={cover.url}
                  width={1280}
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-5">
                <div className="rounded-md border border-white/12 bg-white/10 p-4">
                  <p className="text-xs text-white/50">Aylik baslangic</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {formatTry(vehicle.monthlyPriceFrom)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-lg border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-accent">Paketler</p>
                <h2 className="mt-2 text-2xl font-semibold text-primary">
                  Kiralama secenekleri
                </h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div className="mt-6 grid gap-3">
              {vehicle.packages.map((item) => (
                <div
                  className="grid gap-3 rounded-md border bg-background p-4 sm:grid-cols-[1fr_auto]"
                  key={item.id}
                >
                  <div>
                    <div className="font-semibold text-primary">
                      {item.name ?? "Kiralama paketi"}
                    </div>
                    <div className="mt-1 text-sm text-foreground/60">
                      {item.durationMonths} ay /{" "}
                      {item.annualKm.toLocaleString("tr-TR")} km
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-foreground/48">Aylik</div>
                    <div className="text-xl font-semibold text-primary">
                      {formatTry(item.monthlyPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary">
                Teknik ve operasyon bilgileri
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                {vehicle.features.map((feature) => (
                  <div
                    className="flex items-center justify-between gap-4 border-b pb-3"
                    key={feature.id}
                  >
                    <span className="text-foreground/60">{feature.label}</span>
                    <strong className="text-right">{feature.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary">
                Dahil hizmetler
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                {[
                  "Periyodik bakim",
                  "Lastik yonetimi",
                  "Sigorta ve hasar koordinasyonu",
                  "Yol yardim ve operasyon takibi",
                ].map((item) => (
                  <div className="flex items-center gap-3" key={item}>
                    <BadgeCheck className="h-4 w-4 text-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border bg-surface p-5 shadow-panel lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-lg font-semibold text-primary">Teklif akisi</h2>
          <div className="mt-5 grid gap-3">
            {steps.map((step, index) => (
              <div className="flex items-center gap-3" key={step}>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-accent/10 text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
          <Button asChild className="mt-6 w-full bg-accent hover:bg-accent/90" size="lg">
            <Link href={`/teklif-al?vehicleId=${vehicle.id}`}>
              Bu arac icin teklif al
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function HeroSpec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarFront;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/12 bg-white/[0.06] p-4">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-4 text-xs font-medium uppercase text-white/45">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatTry(value: unknown) {
  if (value === null || value === undefined) {
    return "Teklif ile";
  }

  return `${Number(value).toLocaleString("tr-TR")} TL`;
}
