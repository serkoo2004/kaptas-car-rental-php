import Link from "next/link";
import type { ReactNode } from "react";
import { createVehicle } from "@/app/admin/araclar/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

const fuelOptions = [
  ["GASOLINE", "Benzin"],
  ["GASOLINE_LPG", "Benzin + LPG"],
  ["DIESEL", "Dizel"],
  ["HYBRID", "Hibrit"],
  ["ELECTRIC", "Elektrik"],
];

const transmissionOptions = [
  ["AUTOMATIC", "Otomatik"],
  ["MANUAL", "Manuel"],
];

const driveOptions = [
  ["", "Belirtilmedi"],
  ["FWD", "Önden çekiş (FWD)"],
  ["RWD", "Arkadan itiş (RWD)"],
  ["AWD", "Dört tekerlekten çekiş (AWD)"],
  ["FOUR_WD", "4x4"],
];

const deliveryOptions = [
  ["IN_STOCK", "Stokta"],
  ["LIMITED_STOCK", "Sinirli stok"],
  ["ORDER_ONLY", "Siparisle"],
  ["SOON", "Yakinda"],
];

const statusOptions = [
  ["PUBLISHED", "Yayinda"],
  ["DRAFT", "Taslak"],
  ["ARCHIVED", "Arsiv"],
];

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const error = (await searchParams)?.error;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/araclar">Listeye dön</Link>
          </Button>
        }
        description="Araç modelini, filodaki adet sayısını ve tek günlük kiralama fiyatını oluşturun."
        title="Yeni araç ekle"
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {newVehicleError(error)}
        </div>
      ) : null}

      <form action={createVehicle} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Araç kimliği</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Marka">
                  <Input name="brandName" placeholder="Toyota" required />
                </Field>
                <Field label="Model">
                  <Input name="modelName" placeholder="Corolla" required />
                </Field>
                <Field className="md:col-span-2" label="Katalog basligi">
                  <Input
                    name="title"
                    placeholder="Toyota Corolla 1.5 Hybrid Flame X-Pack"
                    required
                  />
                </Field>
                <Field label="Yil">
                  <Input min={2020} name="year" placeholder="2026" type="number" />
                </Field>
                <Field label="Segment">
                  <Input name="segment" placeholder="C Segment" />
                </Field>
                <Field label="Gövde tipi">
                  <Input name="bodyType" placeholder="Sedan" />
                </Field>
                <Field label="Motor gucu">
                  <Input name="enginePower" placeholder="140 hp" />
                </Field>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Teknik ve yayin bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Yakit">
                  <Select name="fuelType" options={fuelOptions} />
                </Field>
                <Field label="Sanziman">
                  <Select name="transmission" options={transmissionOptions} />
                </Field>
                <Field label="Çekiş tipi">
                  <Select name="driveType" options={driveOptions} />
                </Field>
                <Field label="Teslimat durumu">
                  <Select name="deliveryStatus" options={deliveryOptions} />
                </Field>
                <Field label="Yayin durumu">
                  <Select
                    defaultValue="PUBLISHED"
                    name="status"
                    options={statusOptions}
                  />
                </Field>
                <Field label="Filodaki araç adedi">
                  <Input
                    defaultValue={1}
                    min={0}
                    name="stockCount"
                    placeholder="3"
                    required
                    type="number"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    Bu modelden kiralanabilecek toplam fiziksel araç sayısı.
                  </span>
                </Field>
                <Field label="Günlük kiralama fiyatı (USD)">
                  <Input min="0.01" name="dailyPrice" required step="0.01" type="number" />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    Tek aracın bir günlük kiralama bedeli; paket veya aylık fiyat kullanılmaz.
                  </span>
                </Field>
                <Field label="Elektrikli menzil">
                  <Input name="batteryRange" placeholder="620 km" />
                </Field>
                <Field label="Tuketim">
                  <Input name="consumption" placeholder="4.8 lt / 100 km" />
                </Field>
                <Field className="md:col-span-2" label="Araç fotoğrafları">
                  <Input
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    name="images"
                    type="file"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    İlk fotoğraf kapak olur. JPG, PNG, WEBP veya AVIF; fotoğraf başına en fazla 8 MB.
                  </span>
                </Field>
                <Field className="md:col-span-2" label="Donanımlar">
                  <Textarea
                    name="features"
                    placeholder="Adaptif hiz sabitleyici&#10;Serit takip sistemi&#10;Kablosuz CarPlay"
                  />
                </Field>
              </CardContent>
            </Card>

          </div>

          <aside className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Yayin kontrolleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  defaultChecked
                  name="isPublishedWeb"
                  label="Web katalogda yayinla"
                />
                <Toggle
                  defaultChecked
                  name="isPublishedMobile"
                  label="Mobil API'de yayinla"
                />
                <Toggle name="isFeatured" label="Öne çıkan araç yap" />
                <Button className="w-full" size="lg" type="submit">
                  Aracı kaydet
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="SEO baslik">
                  <Input name="seoTitle" placeholder="Toyota Corolla günlük kiralama" />
                </Field>
                <Field label="SEO açıklama">
                  <Textarea
                    name="seoDescription"
                    placeholder="Toyota Corolla günlük araç kiralama fiyatı ve özellikleri."
                  />
                </Field>
              </CardContent>
            </Card>
          </aside>
        </div>
      </form>
    </div>
  );
}

function newVehicleError(value: string) {
  const messages: Record<string, string> = {
    database: "Veritabanı bağlantısı kurulamadı.",
    "image-upload": "Araç görseli depolama alanına kaydedilemedi.",
    "image-validation": "Görsel biçimini, boyutunu ve dosya sayısını kontrol edin.",
    validation:
      "Günlük fiyat, stok ve zorunlu alanları kontrol edin. Web yayını için en az bir görsel seçilmelidir.",
  };

  return messages[value] ?? "Araç oluşturulamadı. Form bilgilerini kontrol edin.";
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[][];
  defaultValue?: string;
}) {
  return (
    <select
      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5ab31]"
      defaultValue={defaultValue}
      name={name}
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        className="h-4 w-4 accent-[#d5ab31]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
    </label>
  );
}
