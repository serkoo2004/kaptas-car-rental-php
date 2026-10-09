import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  PackagePlus,
  TriangleAlert,
} from "lucide-react";
import { deleteVehicle } from "@/app/admin/araclar/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  database: "Veritabanı bağlantısı kurulamadığı için araç silinemedi.",
  delete_failed:
    "Araç veritabanından silinemedi. Bağlı kayıtları kontrol edip tekrar deneyin.",
  not_found: "Silmek istediğiniz araç artık bulunmuyor.",
  validation: "Silme isteği geçersiz. Sayfayı yenileyip tekrar deneyin.",
  vehicle_has_reservations:
    "Bu araca bağlı rezervasyon geçmişi bulunduğu için kalıcı silme engellendi.",
};

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const deleted = Array.isArray(params.deleted) ? params.deleted[0] : params.deleted;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const vehicles = (await isDatabaseAvailable())
      ? await prisma.vehicle.findMany({
        include: { brand: true, model: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const publishedCount = vehicles.filter((vehicle) => vehicle.isPublishedWeb).length;
  const stockCount = vehicles.reduce(
    (total, vehicle) => total + vehicle.stockCount,
    0,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button asChild>
            <Link href="/admin/araclar/yeni">
              <PackagePlus className="h-4 w-4" />
              Yeni araç ekle
            </Link>
          </Button>
        }
        description="Araç modellerini, filodaki adetleri, tek günlük fiyatları ve web yayın durumunu buradan yönetin."
        title="Araç yönetimi"
      />

      {deleted === "1" ? (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          Araç ve araca bağlı katalog kayıtları veritabanından kalıcı olarak silindi.
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessages[error] ?? "Araç silinirken beklenmeyen bir hata oluştu."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<CarFront className="h-5 w-5" />}
          label="Araç modeli"
          value={vehicles.length.toLocaleString("tr-TR")}
        />
        <MetricCard
          icon={<ArrowUpRight className="h-5 w-5" />}
          label="Web yayında"
          value={publishedCount.toLocaleString("tr-TR")}
        />
        <MetricCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Filodaki toplam araç"
          value={stockCount.toLocaleString("tr-TR")}
          subValue="Fiziksel araç adedi"
        />
      </div>

      <AdminTable
        columns={[
          "Araç",
          "Segment",
          "Stok",
          "Durum",
          "Yayın",
          "Günlük fiyat",
          "",
        ]}
        emptyDescription="İlk aracı ekleyerek katalog, fiyat ve yayın sürecini admin panelden yönetmeye başlayın."
        emptyTitle="Araç bulunamadı"
        rows={vehicles.map((vehicle) => [
          <div key={`${vehicle.id}-title`}>
            <div className="font-semibold text-slate-950">{vehicle.title}</div>
            <div className="text-xs text-slate-500">
              {vehicle.brand.name} {vehicle.model.name}
            </div>
          </div>,
          vehicle.segment ?? vehicle.bodyType ?? "-",
          `${vehicle.stockCount.toLocaleString("tr-TR")} adet`,
          <StatusBadge key={`${vehicle.id}-status`} status={vehicle.status} />,
          vehicle.isPublishedWeb ? "Web yayında" : "Web kapalı",
          vehicle.dailyPrice
            ? `${Number(vehicle.dailyPrice).toLocaleString("en-US")} USD/gün`
            : "-",
          <div className="flex items-center gap-2" key={`${vehicle.id}-actions`}>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/araclar/${vehicle.id}`}>Yönet</Link>
            </Button>
            <DeleteVehicleButton
              action={deleteVehicle}
              vehicleId={vehicle.id}
              vehicleTitle={vehicle.title}
            />
          </div>,
        ])}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">{value}</div>
          {subValue ? (
            <div className="mt-1 text-xs font-medium text-slate-500">
              {subValue}
            </div>
          ) : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#fff2bf] text-[#765a0d]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
