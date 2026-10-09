import type { ReactNode } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { cancelReservation } from "@/app/admin/rezervasyonlar/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { expireStaleReservationHolds } from "@/lib/reservations/availability";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  database: "Veritabanı bağlantısı kurulamadı.",
  "not-active": "Yalnızca aktif rezervasyonlar iptal edilebilir.",
  "not-found": "Rezervasyon bulunamadı.",
};

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const databaseReady = await isDatabaseAvailable();

  if (databaseReady) {
    await expireStaleReservationHolds();
  }

  const reservations = databaseReady
    ? await prisma.reservation.findMany({
        include: {
          paymentIntent: {
            select: {
              amount: true,
              currency: true,
              provider: true,
              providerRef: true,
              status: true,
            },
          },
          vehicle: { include: { brand: true, model: true } },
        },
        orderBy: [{ pickupAt: "asc" }, { createdAt: "desc" }],
        take: 200,
      })
    : [];
  const confirmed = reservations.filter(
    (reservation) => reservation.status === "CONFIRMED",
  ).length;
  const holds = reservations.filter(
    (reservation) => reservation.status === "HOLD",
  ).length;
  const cancelled = reservations.filter(
    (reservation) => reservation.status === "CANCELLED",
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Araçların tarih bazlı doluluk durumunu, ödeme bekleyen geçici blokajları ve kesinleşen kiralamaları takip edin."
        title="Rezervasyon takibi"
      />

      {errorParam ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessages[errorParam] ?? "İşlem tamamlanamadı."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <ReservationMetric
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Kesinleşen"
          value={confirmed}
        />
        <ReservationMetric
          icon={<Clock3 className="h-5 w-5" />}
          label="Ödeme bekleyen"
          value={holds}
        />
        <ReservationMetric
          icon={<XCircle className="h-5 w-5" />}
          label="İptal edilen"
          value={cancelled}
        />
      </div>

      <AdminTable
        columns={[
          "Araç",
          "Müşteri",
          "Alış",
          "Bırakış",
          "Durum",
          "Ödeme",
          "",
        ]}
        emptyDescription="Kiralama akışından oluşturulan kayıtlar burada tarih sırasıyla görünür."
        emptyTitle="Henüz rezervasyon yok"
        rows={reservations.map((reservation) => [
          <div key={`${reservation.id}-vehicle`}>
            <div className="font-semibold text-slate-950">
              {reservation.vehicle.brand.name} {reservation.vehicle.model.name}
            </div>
            <div className="text-xs text-slate-500">
              Stok: {reservation.vehicle.stockCount}
            </div>
          </div>,
          <div key={`${reservation.id}-customer`}>
            <div className="font-semibold text-slate-900">
              {reservation.customerName}
            </div>
            <div className="text-xs text-slate-500">
              {reservation.customerEmail}
            </div>
          </div>,
          <DateCell
            date={reservation.pickupAt}
            key={`${reservation.id}-pickup`}
            location={reservation.pickupLocation}
          />,
          <DateCell
            date={reservation.dropoffAt}
            key={`${reservation.id}-dropoff`}
            location={reservation.dropoffLocation}
          />,
          <div key={`${reservation.id}-status`}>
            <StatusBadge status={reservation.status} />
            {reservation.status === "HOLD" && reservation.holdExpiresAt ? (
              <div className="mt-1 text-xs text-slate-500">
                {formatDate(reservation.holdExpiresAt)} tarihine kadar
              </div>
            ) : null}
          </div>,
          reservation.paymentIntent ? (
            <div key={`${reservation.id}-payment`}>
              <div className="font-semibold text-slate-900">
                {reservation.paymentIntent.status} ·{" "}
                {formatMoney(
                  Number(reservation.paymentIntent.amount),
                  reservation.paymentIntent.currency,
                )}
              </div>
              <div className="text-xs text-slate-500">
                {reservation.paymentIntent.provider || "Sağlayıcı yok"}
                {reservation.paymentIntent.providerRef
                  ? ` · ${reservation.paymentIntent.providerRef}`
                  : ""}
              </div>
            </div>
          ) : (
            "-"
          ),
          ["HOLD", "CONFIRMED"].includes(reservation.status) ? (
            <form action={cancelReservation} key={`${reservation.id}-action`}>
              <input name="id" type="hidden" value={reservation.id} />
              <Button size="sm" type="submit" variant="destructive">
                İptal et
              </Button>
            </form>
          ) : (
            <span className="text-xs text-slate-400" key={`${reservation.id}-empty`}>
              İşlem yok
            </span>
          ),
        ])}
      />
    </div>
  );
}

function DateCell({
  date,
  location,
}: {
  date: Date;
  location: string | null;
}) {
  return (
    <div>
      <div className="font-semibold text-slate-900">{formatDate(date)}</div>
      <div className="text-xs text-slate-500">{location || "Lokasyon yok"}</div>
    </div>
  );
}

function ReservationMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">
            {value.toLocaleString("tr-TR")}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-100 text-amber-800">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    style: "currency",
  }).format(amount);
}
