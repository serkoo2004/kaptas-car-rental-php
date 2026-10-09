import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Fuel,
  Gauge,
  Headphones,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import {
  getBootstrapBlogPosts,
  getBootstrapVehicles,
  type CatalogVehicle,
} from "@/lib/vehicles/bootstrap-catalog";
import { getPublishedVehicles, type VehicleFilters } from "@/lib/vehicles/queries";

export const dynamic = "force-dynamic";

type DbVehicle = Awaited<ReturnType<typeof getPublishedVehicles>>[number];
type VehicleCard = DbVehicle | CatalogVehicle;

const locationOptions = ["Merkez Ofis"];

const timeOptions = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const quickFilters = [
  { href: "/?transmission=AUTOMATIC", label: "Otomatik" },
  { href: "/?fuelType=DIESEL", label: "Dizel" },
  { href: "/?fuelType=GASOLINE", label: "Benzin" },
  { href: "/?fuelType=GASOLINE_LPG", label: "Benzin + LPG" },
  { href: "/?maxMonthlyPrice=40000", label: "Ekonomik" },
];

const trustItems = [
  {
    icon: CreditCard,
    title: "3D Secure ödeme",
    text: "Kart işlemi güvenli ödeme adımına yönlenir.",
  },
  {
    icon: Headphones,
    title: "Hızlı destek",
    text: "Rezervasyon öncesi ve teslimatta destek alın.",
  },
  {
    icon: ShieldCheck,
    title: "Bakımlı araçlar",
    text: "Yayınlanan araçlar teslimata hazır süreçle ilerler.",
  },
  {
    icon: Clock3,
    title: "Dakikalar içinde",
    text: "Aracı seçin, bilgileri girin, ödemeye geçin.",
  },
];

const vehicleVisuals: Record<string, string> = {
  Fiat:
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=82",
  Ford:
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=82",
  Hyundai:
    "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=900&q=82",
  Renault:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=82",
  Tesla:
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=900&q=82",
  Toyota:
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=82",
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const filters = toFilters(params);
  let vehicles: VehicleCard[] = [];

  if (await isDatabaseAvailable()) {
    try {
      vehicles = await getPublishedVehicles(filters);
    } catch {
      vehicles = [];
    }
  }

  if (vehicles.length === 0) {
    vehicles = getBootstrapVehicles(filters);
  }

  const posts = getBootstrapBlogPosts().slice(0, 3);
  const featured = vehicles.filter((vehicle) => vehicle.isFeatured).length;
  const stocked = vehicles.filter((vehicle) => vehicle.stockCount > 0).length;

  return (
    <div className="bg-background">
      <section className="border-b border-red-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-12">
          <div className="animate-reveal-up flex flex-col justify-center">
            <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-red-600">
              <span className="h-px w-10 bg-red-500" />
              <span>Araç kiralama</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-primary sm:text-5xl">
              Aracınızı seçin, güvenli ödeme adımına geçin.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/66">
              Günlük kiralama için uygun araçları, teslimat bilgilerini ve ödeme
              sürecini tek ekranda toplayan sade rezervasyon deneyimi.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Link
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:border-red-500 hover:text-red-600"
                  href={filter.href}
                  key={filter.href}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <form className="animate-soft-scale rounded-lg border border-red-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-4 border-b border-red-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Hızlı rezervasyon
                </h2>
                <p className="mt-1 text-xs font-medium text-foreground/52">
                  Alış ve bırakış bilgilerini seçin.
                </p>
              </div>
              <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                Online fiyat
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <BookingSelect
                icon={MapPin}
                label="Alış lokasyonu"
                name="pickupLocation"
                options={locationOptions}
              />
              <BookingInput icon={CalendarDays} label="Alış tarihi" name="pickupDate" />
              <BookingSelect
                icon={Clock3}
                label="Alış saati"
                name="pickupTime"
                options={timeOptions}
              />
              <BookingInput
                icon={CalendarDays}
                label="Bırakış tarihi"
                name="dropoffDate"
              />
              <BookingSelect
                icon={Clock3}
                label="Bırakış saati"
                name="dropoffTime"
                options={timeOptions}
              />
            </div>

            <Button className="mt-4 w-full bg-red-600 hover:bg-red-700" size="lg" type="submit">
              Araçları listele
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      <section className="border-b border-red-100 bg-surface">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item, index) => (
            <TrustItem index={index} item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="animate-reveal-up space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-primary">Filtrele</h2>
                <p className="text-xs text-foreground/55">Araçları daralt</p>
              </div>
            </div>
            <form className="mt-6 grid gap-4">
              <FilterInput defaultValue={valueOf(params.brand)} label="Marka" name="brand" />
              <FilterInput defaultValue={valueOf(params.model)} label="Model" name="model" />
              <FilterSelect
                defaultValue={valueOf(params.fuelType)}
                label="Yakıt tipi"
                name="fuelType"
                options={[
                  ["", "Tüm yakıtlar"],
                  ["GASOLINE", "Benzin"],
                  ["GASOLINE_LPG", "Benzin + LPG"],
                  ["DIESEL", "Dizel"],
                  ["HYBRID", "Hybrid"],
                  ["ELECTRIC", "Elektrikli"],
                ]}
              />
              <FilterSelect
                defaultValue={valueOf(params.transmission)}
                label="Vites"
                name="transmission"
                options={[
                  ["", "Tüm vitesler"],
                  ["AUTOMATIC", "Otomatik"],
                  ["MANUAL", "Manuel"],
                ]}
              />
              <FilterInput
                defaultValue={valueOf(params.maxMonthlyPrice)}
                label="Maksimum fiyat"
                name="maxMonthlyPrice"
                type="number"
              />
              <Button type="submit">
                Uygula
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Filtreleri temizle</Link>
              </Button>
            </form>
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">Kiralama özeti</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <Metric label="Listelenen araç" value={String(vehicles.length)} />
              <Metric label="Öne çıkan" value={String(featured)} />
              <Metric label="Stokta teslim" value={String(stocked)} />
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.42fr] lg:items-center">
              <div>
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-red-600">
                  <span className="h-px w-8 bg-red-500" />
                  <span>Araç seçenekleri</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-normal text-primary">
                  Uygun araçları karşılaştırın.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/65">
                  Ekonomik sınıftan SUV ve hafif ticariye kadar farklı kullanım
                  ihtiyaçlarına uygun araçlar listelenir. Aracı seçtikten sonra
                  kiralama bilgileri, adres ve kart adımıyla güvenli ödeme
                  süreci başlar.
                </p>
              </div>
              <div className="grid gap-2 rounded-md border border-red-100 bg-red-50/50 p-4 text-sm">
                <InlineCheck text="Komisyonsuz online işlem" />
                <InlineCheck text="3D Secure ödeme akışı" />
                <InlineCheck text="Teslimat öncesi hızlı teyit" />
              </div>
            </div>
          </section>

          {vehicles.length === 0 ? (
            <EmptyState
              action={
                <Button asChild>
                  <Link href="/iletisim">Uygun araç isteyin</Link>
                </Button>
              }
              description="Seçili filtrelerle eşleşen araç bulunamadı. İhtiyacınızı ilettiğinizde size uygun alternatifleri hazırlarız."
              title="Bu filtreyle eşleşen araç yok"
            />
          ) : (
            <section className="grid gap-5">
              {vehicles.map((vehicle, index) => (
                <VehicleCardView index={index} key={vehicle.id} vehicle={vehicle} />
              ))}
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-accent">Blog</p>
                  <h2 className="mt-1 text-xl font-semibold text-primary">
                    Kiralama rehberleri
                  </h2>
                </div>
                <Button asChild variant="outline">
                  <Link href="/blog">Tümünü gör</Link>
                </Button>
              </div>
              <div className="mt-5 grid gap-3">
                {posts.map((post) => (
                  <Link
                    className="group rounded-md border border-red-100 p-4 transition hover:border-red-400 hover:bg-red-50/40"
                    href={`/blog/${post.slug}`}
                    key={post.id}
                  >
                    <div className="text-sm font-semibold text-primary group-hover:text-red-600">
                      {post.title}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/60">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-accent">İletişim</p>
              <h2 className="mt-1 text-xl font-semibold text-primary">
                Teslimat için destek alın.
              </h2>
              <p className="mt-3 text-sm leading-7 text-foreground/64">
                Teslimat adresi, saat değişikliği veya özel araç ihtiyacı için
                ekibimizden hızlı dönüş alabilirsiniz.
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                <ContactLine label="Telefon" value="+90 850 000 00 00" />
                <ContactLine label="E-posta" value="info@arackiralama.local" />
              </div>
              <Button asChild className="mt-5 w-full bg-accent hover:bg-accent/90">
                <Link href="/iletisim">
                  İletişime geç
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function VehicleCardView({
  vehicle,
  index,
}: {
  vehicle: VehicleCard;
  index: number;
}) {
  const firstPackage = vehicle.packages[0];
  const cover = vehicleVisuals[vehicle.brand.name] ?? vehicle.images[0]?.url;

  return (
    <article
      className={`hover-lift animate-reveal-up overflow-hidden rounded-lg border border-red-200 bg-white shadow-sm ${
        index % 3 === 1 ? "motion-delay-1" : index % 3 === 2 ? "motion-delay-2" : ""
      }`}
    >
      <div className="grid lg:grid-cols-[300px_1fr_220px]">
        <div className="relative min-h-56 overflow-hidden bg-surface-muted">
          {cover ? (
            <Image
              alt={vehicle.images[0]?.alt ?? vehicle.title}
              className="h-full min-h-56 w-full object-cover transition duration-500 hover:scale-105"
              height={520}
              src={cover}
              unoptimized={cover.startsWith("https://")}
              width={780}
            />
          ) : null}
          <div className="absolute left-4 top-4 rounded-md bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            {translateDelivery(vehicle.deliveryStatus)}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {vehicle.isFeatured ? (
              <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                Fırsat aracı
              </span>
            ) : null}
            <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              {vehicle.segment ?? vehicle.bodyType ?? "Kiralık araç"}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-semibold leading-tight text-primary">
            {vehicle.brand.name} {vehicle.model.name}
          </h3>
          <p className="mt-2 text-sm text-foreground/58">
            {vehicle.title} veya benzeri
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Spec icon={Fuel} label={translateFuel(vehicle.fuelType)} />
            <Spec icon={Gauge} label={translateTransmission(vehicle.transmission)} />
            <Spec icon={Users} label="5 kişi" />
            <Spec icon={Briefcase} label={vehicle.bodyType ?? "Bagaj"} />
          </div>

          <div className="mt-5 rounded-md border border-red-100 bg-red-50/45 p-4">
            <p className="text-xs font-semibold uppercase text-foreground/45">
              Kiralama koşulu
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              Minimum {minimumAge(vehicle)} yaş - {minimumLicenseYear(vehicle)} yıl
              ehliyet
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-red-100 p-5 lg:border-l lg:border-t-0">
          <div>
            <p className="text-xs font-medium text-foreground/48">
              Günlük başlangıç
            </p>
            <p className="mt-1 text-3xl font-semibold text-primary">
              {formatDailyPrice(vehicle.monthlyPriceFrom)}
            </p>
            <p className="mt-2 text-xs leading-5 text-foreground/55">
              {firstPackage
                ? `${firstPackage.durationMonths} ay / ${firstPackage.annualKm.toLocaleString("tr-TR")} km referans paket`
                : "Paket bilgisi teklif aşamasında netleşir"}
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href={`/satin-al?vehicleId=${vehicle.id}`}>
                Satın Al
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/iletisim">Destek al</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BookingInput({
  icon: Icon,
  label,
  name,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-semibold text-primary">
      <span>{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-red-100 bg-surface px-3">
        <Icon className="h-4 w-4 text-accent" />
        <input
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
          name={name}
          type="date"
        />
      </span>
    </label>
  );
}

function BookingSelect({
  icon: Icon,
  label,
  name,
  options,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="space-y-1.5 text-sm font-semibold text-primary">
      <span>{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-red-100 bg-surface px-3">
        <Icon className="h-4 w-4 text-accent" />
        <select
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
          name={name}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function FilterInput({
  defaultValue,
  label,
  name,
  type = "search",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  type?: "number" | "search";
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <input
        className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        name={name}
        type={type}
      />
    </label>
  );
}

function FilterSelect({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <select
        className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue={defaultValue ?? ""}
        name={name}
      >
        {options.map(([value, labelText]) => (
          <option key={labelText} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrustItem({
  item,
  index,
}: {
  item: { icon: LucideIcon; title: string; text: string };
  index: number;
}) {
  const Icon = item.icon;

  return (
    <div
      className={`animate-reveal-up rounded-lg border border-red-100 bg-white p-4 shadow-sm ${
        index === 1 ? "motion-delay-1" : index === 2 ? "motion-delay-2" : index === 3 ? "motion-delay-3" : ""
      }`}
    >
      <Icon className="h-5 w-5 text-accent" />
      <div className="mt-3 text-sm font-semibold text-primary">{item.title}</div>
      <p className="mt-1 text-xs leading-5 text-foreground/58">{item.text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-red-100 bg-red-50/50 px-3 py-2">
      <span className="text-foreground/58">{label}</span>
      <strong className="text-primary">{value}</strong>
    </div>
  );
}

function Spec({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-muted px-3 py-2">
      <Icon className="h-4 w-4 text-accent" />
      <span>{label}</span>
    </div>
  );
}

function InlineCheck({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 font-medium text-primary">
      <CheckCircle2 className="h-4 w-4 text-accent" />
      <span>{text}</span>
    </div>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-red-100 px-3 py-2">
      <span className="text-foreground/55">{label}</span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}

function toFilters(params: Record<string, string | string[] | undefined>): VehicleFilters {
  return {
    brand: valueOf(params.brand),
    durationMonths: valueOf(params.durationMonths),
    fuelType: valueOf(params.fuelType),
    maxMonthlyPrice: valueOf(params.maxMonthlyPrice),
    model: valueOf(params.model),
    transmission: valueOf(params.transmission),
  };
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDailyPrice(value: unknown) {
  if (value === null || value === undefined) {
    return "Teklif ile";
  }

  const daily = Math.max(1, Math.round(Number(value) / 30));

  return `${daily.toLocaleString("tr-TR")} TL`;
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

function translateDelivery(value: string) {
  const labels: Record<string, string> = {
    IN_STOCK: "Stokta",
    LIMITED_STOCK: "Sınırlı stok",
    ORDER_ONLY: "Rezervasyonla",
    SOON: "Yakında",
  };

  return labels[value] ?? value;
}

function minimumAge(vehicle: VehicleCard) {
  if ((vehicle.segment ?? "").toLocaleLowerCase("tr-TR").includes("suv")) {
    return 27;
  }

  if ((vehicle.bodyType ?? "").toLocaleLowerCase("tr-TR").includes("van")) {
    return 25;
  }

  return vehicle.monthlyPriceFrom && Number(vehicle.monthlyPriceFrom) > 45000 ? 25 : 21;
}

function minimumLicenseYear(vehicle: VehicleCard) {
  return minimumAge(vehicle) >= 25 ? 3 : 1;
}
