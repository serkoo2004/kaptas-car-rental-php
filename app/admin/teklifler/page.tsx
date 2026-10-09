import Link from "next/link";
import type { ReactNode } from "react";
import { CircleDollarSign, FileText, Send } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const offers = (await isDatabaseAvailable())
    ? await prisma.quoteOffer.findMany({
        include: { items: true, quoteRequest: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];
  const sentCount = offers.filter((offer) => offer.status === "SENT").length;
  const draftCount = offers.filter((offer) => offer.status === "DRAFT").length;
  const monthlyPortfolio = offers.reduce(
    (total, offer) => total + Number(offer.totalMonthly ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Hazırlanan filo tekliflerini, aylık portföy değerini, geçerlilik tarihlerini ve müşteri bağlantısını takip edin."
        title="Teklif operasyonu"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <OfferMetric
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Aylik teklif portfoyu"
          value={`${monthlyPortfolio.toLocaleString("tr-TR")} TL`}
        />
        <OfferMetric
          icon={<FileText className="h-5 w-5" />}
          label="Draft teklif"
          value={draftCount.toLocaleString("tr-TR")}
        />
        <OfferMetric
          icon={<Send className="h-5 w-5" />}
          label="Gonderilen"
          value={sentCount.toLocaleString("tr-TR")}
        />
      </div>

      <AdminTable
        columns={[
          "Teklif",
          "Musteri",
          "Kalem",
          "Aylik toplam",
          "Durum",
          "Gecerlilik",
          "",
        ]}
        emptyDescription="Henüz teklif oluşturulmadı. Başvuru detayından teklif oluşturulduğunda burada listelenir."
        emptyTitle="Teklif bulunamadi"
        rows={offers.map((offer) => [
          <div key={`${offer.id}-title`}>
            <div className="font-semibold text-slate-950">{offer.title}</div>
            <div className="text-xs text-slate-500">
              {offer.currency} / {offer.createdAt.toLocaleDateString("tr-TR")}
            </div>
          </div>,
          offer.quoteRequest.companyName ?? offer.quoteRequest.contactName,
          `${offer.items.length.toLocaleString("tr-TR")} kalem`,
          offer.totalMonthly ? `${Number(offer.totalMonthly).toLocaleString("tr-TR")} TL` : "-",
          offer.status,
          offer.validUntil ? offer.validUntil.toLocaleDateString("tr-TR") : "-",
          <Button asChild key={`${offer.id}-action`} size="sm" variant="outline">
            <Link href={`/admin/basvurular/${offer.quoteRequestId}`}>
              Başvuruya git
            </Link>
          </Button>,
        ])}
      />
    </div>
  );
}

function OfferMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#fff2bf] text-[#765a0d]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
