import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ImagePlus, Save, Star } from "lucide-react";
import {
  deleteVehicleImage,
  setVehicleCoverImage,
  updateVehicleImage,
  updateVehicle,
  uploadVehicleImages,
} from "@/app/admin/araclar/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { DeleteVehicleImageButton } from "@/components/admin/delete-vehicle-image-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

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
  ["DRAFT", "Taslak"],
  ["PUBLISHED", "Yayinda"],
  ["ARCHIVED", "Arsiv"],
];

export default async function AdminVehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  if (!(await isDatabaseAvailable())) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          description="Araç detaylarını yönetmek için veritabanı bağlantısı gereklidir."
          title="Araç detayı"
        />
        <EmptyState
          description="Veritabanı çalışır duruma geldiğinde araç adedi ve günlük fiyat buradan düzenlenir."
          title="Veritabanı bağlantısı hazır değil"
        />
      </div>
    );
  }

  const vehicle = await prisma.vehicle.findUnique({
    include: {
      brand: true,
      features: {
        orderBy: { sortOrder: "asc" },
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      },
      model: true,
    },
    where: { id },
  });

  if (!vehicle) {
    notFound();
  }

  const publicPath =
    vehicle.isPublishedWeb && vehicle.status === "PUBLISHED"
      ? `/araclar/${vehicle.slug}`
      : null;

  return (
    <div className="space-y-6">
      {query.saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {savedMessage(query.saved)}
        </div>
      ) : null}
      {query.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {errorMessage(query.error)}
        </div>
      ) : null}
      <AdminPageHeader
        actions={
          <>
            {publicPath ? (
              <Button asChild variant="outline">
                <Link href={publicPath}>Public sayfayi ac</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/admin/araclar">Listeye dön</Link>
            </Button>
          </>
        }
        description={`${vehicle.brand.name} ${vehicle.model.name} için katalog, araç adedi, yayın ve tek günlük fiyat yönetimi.`}
        title={vehicle.title}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard label="Durum" value={<StatusBadge status={vehicle.status} />} />
        <InfoCard
          label="Web yayin"
          value={vehicle.isPublishedWeb ? "Yayinda" : "Kapali"}
        />
        <InfoCard
          label="Günlük fiyat (USD)"
          value={
            vehicle.dailyPrice
              ? `${Number(vehicle.dailyPrice).toLocaleString("en-US")} USD`
              : "-"
          }
        />
        <InfoCard
          label="Filodaki araç"
          value={`${vehicle.stockCount.toLocaleString("tr-TR")} adet`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Araç bilgilerini düzenle</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateVehicle} className="grid gap-4 md:grid-cols-2">
                <input name="vehicleId" type="hidden" value={vehicle.id} />
                <Field label="Marka">
                  <Input
                    defaultValue={vehicle.brand.name}
                    name="brandName"
                    required
                  />
                </Field>
                <Field label="Model">
                  <Input
                    defaultValue={vehicle.model.name}
                    name="modelName"
                    required
                  />
                </Field>
                <Field className="md:col-span-2" label="Katalog basligi">
                  <Input defaultValue={vehicle.title} name="title" required />
                </Field>
                <Field label="Yil">
                  <Input
                    defaultValue={vehicle.year ?? ""}
                    min={2020}
                    name="year"
                    type="number"
                  />
                </Field>
                <Field label="Segment">
                  <Input defaultValue={vehicle.segment ?? ""} name="segment" />
                </Field>
                <Field label="Govde tipi">
                  <Input defaultValue={vehicle.bodyType ?? ""} name="bodyType" />
                </Field>
                <Field label="Motor gucu">
                  <Input
                    defaultValue={vehicle.enginePower ?? ""}
                    name="enginePower"
                  />
                </Field>
                <Field label="Yakit">
                  <Select
                    defaultValue={vehicle.fuelType}
                    name="fuelType"
                    options={fuelOptions}
                  />
                </Field>
                <Field label="Sanziman">
                  <Select
                    defaultValue={vehicle.transmission}
                    name="transmission"
                    options={transmissionOptions}
                  />
                </Field>
                <Field label="Çekiş tipi">
                  <Select
                    defaultValue={vehicle.driveType ?? ""}
                    name="driveType"
                    options={driveOptions}
                  />
                </Field>
                <Field label="Teslimat durumu">
                  <Select
                    defaultValue={vehicle.deliveryStatus}
                    name="deliveryStatus"
                    options={deliveryOptions}
                  />
                </Field>
                <Field label="Yönetim durumu">
                  <Select
                    defaultValue={vehicle.status}
                    name="status"
                    options={statusOptions}
                  />
                </Field>
                <Field label="Filodaki araç adedi">
                  <Input
                    defaultValue={vehicle.stockCount}
                    min={0}
                    name="stockCount"
                    required
                    type="number"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    Bu modelden kiralanabilecek toplam fiziksel araç sayısı.
                  </span>
                </Field>
                <Field label="Günlük kiralama fiyatı (USD)">
                  <Input
                    defaultValue={
                      vehicle.dailyPrice
                        ? Number(vehicle.dailyPrice).toFixed(2)
                        : ""
                    }
                    min="0.01"
                    name="dailyPrice"
                    required
                    step="0.01"
                    type="number"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    Tek aracın bir günlük USD fiyatı; paket veya aylık fiyat kullanılmaz.
                  </span>
                </Field>
                <Field label="Elektrikli menzil">
                  <Input
                    defaultValue={vehicle.batteryRange ?? ""}
                    name="batteryRange"
                  />
                </Field>
                <Field label="Tuketim">
                  <Input
                    defaultValue={vehicle.consumption ?? ""}
                    name="consumption"
                  />
                </Field>
                <Field className="md:col-span-2" label="SEO baslik">
                  <Input defaultValue={vehicle.seoTitle ?? ""} name="seoTitle" />
                </Field>
                <Field className="md:col-span-2" label="SEO açıklama">
                  <Textarea
                    defaultValue={vehicle.seoDescription ?? ""}
                    name="seoDescription"
                  />
                </Field>
                <Field className="md:col-span-2" label="Araç özellikleri (Özellik: Değer)">
                  <Textarea
                    defaultValue={vehicle.features
                      .map((feature) => `${feature.label}: ${feature.value}`)
                      .join("\n")}
                    name="features"
                    placeholder="Klima: Standart&#10;Menzil: 533 km&#10;Hız sabitleyici: Adaptif"
                    rows={6}
                  />
                </Field>
                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2 md:grid-cols-3">
                  <Toggle
                    defaultChecked={vehicle.isPublishedWeb}
                    label="Web yayinda"
                    name="isPublishedWeb"
                  />
                  <Toggle
                    defaultChecked={vehicle.isPublishedMobile}
                    label="Mobil API"
                    name="isPublishedMobile"
                  />
                  <Toggle
                    defaultChecked={vehicle.isFeatured}
                    label="One cikan"
                    name="isFeatured"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button size="lg" type="submit">
                    Araç bilgilerini kaydet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Araç görselleri</CardTitle>
              <p className="text-sm text-slate-500">
                Fotoğrafları yükleyin, sıralayın ve web sitesinde kullanılacak kapak görselini seçin.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <form
                action={uploadVehicleImages}
                className="flex flex-col gap-3 border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-end"
              >
                <input name="vehicleId" type="hidden" value={vehicle.id} />
                <Field className="min-w-0 flex-1" label="Yeni fotoğraflar">
                  <Input
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    name="images"
                    required
                    type="file"
                  />
                </Field>
                <Button type="submit">
                  <ImagePlus aria-hidden="true" className="h-4 w-4" />
                  Fotoğrafları yükle
                </Button>
              </form>

              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>JPG, PNG, WEBP veya AVIF</span>
                <span>Fotoğraf başına 8 MB, toplam 40 MB</span>
              </div>

              {vehicle.images.length ? (
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {vehicle.images.map((image, index) => (
                    <div className="grid gap-4 py-5 lg:grid-cols-[220px_1fr]" key={image.id}>
                      <div className="relative aspect-[16/10] overflow-hidden border border-slate-200 bg-slate-100">
                        <Image
                          alt={image.alt || vehicle.title}
                          className="object-contain"
                          fill
                          priority={index === 0}
                          sizes="220px"
                          src={image.url}
                          unoptimized
                        />
                        {image.isCover ? (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-[#d5ab31] px-2 py-1 text-xs font-bold text-slate-950">
                            <Star aria-hidden="true" className="h-3 w-3" />
                            Kapak
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <form action={updateVehicleImage} className="space-y-4">
                          <input name="imageId" type="hidden" value={image.id} />
                          <input name="vehicleId" type="hidden" value={vehicle.id} />
                          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                            <Field label="Görsel açıklaması">
                              <Input
                                defaultValue={image.alt ?? vehicle.title}
                                name="alt"
                                placeholder={vehicle.title}
                              />
                            </Field>
                            <Field label="Sıra">
                              <Input
                                defaultValue={image.sortOrder}
                                min={0}
                                name="sortOrder"
                                type="number"
                              />
                            </Field>
                          </div>
                          <Field label="Fotoğrafı değiştir">
                            <Input
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              name="replacementImage"
                              type="file"
                            />
                          </Field>
                          <div className="flex justify-end">
                            <Button size="sm" type="submit" variant="outline">
                              <Save aria-hidden="true" className="h-4 w-4" />
                              Görsel bilgilerini kaydet
                            </Button>
                          </div>
                        </form>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
                          {image.isCover ? (
                            <span className="text-xs font-semibold text-emerald-700">
                              Web sitesinin aktif kapak görseli
                            </span>
                          ) : (
                            <form action={setVehicleCoverImage}>
                              <input name="imageId" type="hidden" value={image.id} />
                              <input name="vehicleId" type="hidden" value={vehicle.id} />
                              <Button size="sm" type="submit" variant="outline">
                                <Star aria-hidden="true" className="h-4 w-4" />
                                Kapak yap
                              </Button>
                            </form>
                          )}
                          <DeleteVehicleImageButton
                            action={deleteVehicleImage}
                            imageId={image.id}
                            vehicleId={vehicle.id}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <ImagePlus aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
                  <div className="mt-2 font-semibold text-slate-800">Henüz araç görseli yok</div>
                  <p className="mt-1 text-sm text-slate-500">
                    İlk yüklenen fotoğraf otomatik olarak kapak görseli yapılır.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <aside className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Katalog verisi</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminTable
                columns={["Alan", "Deger"]}
                emptyDescription="Araç detayı yok."
                emptyTitle="Veri yok"
                rows={[
                  ["Slug", vehicle.slug],
                  ["Yakit", vehicle.fuelType],
                  ["Teslimat", vehicle.deliveryStatus],
                  ["Güncelleme", vehicle.updatedAt.toLocaleString("tr-TR")],
                  ["Görsel", `${vehicle.images.length} kayıt`],
                  ["Donanım", `${vehicle.features.length} kayıt`],
                ]}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="text-sm font-semibold text-slate-500">{label}</div>
        <div className="mt-2 text-lg font-bold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
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
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
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

function savedMessage(value: string) {
  const messages: Record<string, string> = {
    cover: "Kapak görseli değiştirildi ve web kataloğu güncellendi.",
    image: "Görsel bilgileri kaydedildi.",
    "image-deleted": "Görsel veritabanından ve depolama alanından silindi.",
    images: "Yeni fotoğraflar yüklendi ve web kataloğuna aktarıldı.",
    vehicle: "Araç bilgileri kaydedildi ve web kataloğuna aktarıldı.",
  };

  return messages[value] ?? "Değişiklikler kaydedildi.";
}

function errorMessage(value: string) {
  const messages: Record<string, string> = {
    "image-limit": "Bir araç için en fazla 20 fotoğraf saklanabilir.",
    "image-not-found": "İşlem yapılacak görsel artık bulunmuyor.",
    "image-upload": "Görsel depolama alanına kaydedilemedi. Sunucu yazma izinlerini kontrol edin.",
    "image-validation": "Görsel biçimini, boyutunu ve dosya sayısını kontrol edin.",
    "publish-requires-image": "Aracı web kataloğunda yayınlamak için en az bir görsel yükleyin.",
    "stock-below-reservations": "Araç adedi, gelecekte aynı anda devam edecek aktif rezervasyon sayısının altına düşürülemez.",
  };

  return messages[value] ?? "Form kaydedilemedi. Zorunlu alanları ve sayı biçimlerini kontrol edin.";
}
