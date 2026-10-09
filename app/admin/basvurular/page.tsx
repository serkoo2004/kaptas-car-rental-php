import Link from "next/link";
import type { ReactNode } from "react";
import { Clock3, FileCheck2, UserRoundCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const databaseReady = await isDatabaseAvailable();
  const [leads, statusCounts] = databaseReady
    ? await Promise.all([
        prisma.quoteRequest.findMany({
          include: {
            assignedSalesRep: true,
            documents: true,
            items: {
              include: {
                vehicle: {
                  include: { brand: true, model: true },
                },
              },
            },
            offers: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 80,
        }),
        prisma.quoteRequest.groupBy({
          _count: true,
          by: ["status"],
        }),
      ])
    : [[], []];

  const countByStatus = new Map<string, number>(
    statusCounts.map((item) => [item.status, item._count]),
  );
  const openLeadCount = leads.filter(
    (lead) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(lead.status),
  ).length;
  const unassignedCount = leads.filter((lead) => !lead.assignedSalesRepId).length;
  const waitingDocumentCount = countByStatus.get("WAITING_DOCUMENTS") ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Web teklif başvurularını CRM pipeline mantığıyla takip edin, temsilci atayın, evrak ve teklif durumunu hızlıca görün."
        title="Lead ve başvuru merkezi"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Açık iş"
          value={openLeadCount}
        />
        <MetricCard
          icon={<UserRoundCheck className="h-5 w-5" />}
          label="Atama bekleyen"
          value={unassignedCount}
        />
        <MetricCard
          icon={<FileCheck2 className="h-5 w-5" />}
          label="Evrak bekleyen"
          value={waitingDocumentCount}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {[
          ["RECEIVED", "Yeni"],
          ["REVIEWING", "Inceleme"],
          ["PREPARING_OFFER", "Teklif"],
          ["OFFER_SENT", "Gonderildi"],
          ["WAITING_DOCUMENTS", "Evrak"],
          ["CONTRACT_STAGE", "Sozlesme"],
        ].map(([status, label]) => (
          <div
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={status}
          >
            <div className="text-xs font-semibold uppercase text-slate-500">
              {label}
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {(countByStatus.get(status) ?? 0).toLocaleString("tr-TR")}
            </div>
          </div>
        ))}
      </div>

      <AdminTable
        columns={[
          "Başvuru",
          "Araç ihtiyacı",
          "Durum",
          "Atanan",
          "Evrak",
          "Teklif",
          "Güncelleme",
          "",
        ]}
        emptyDescription="Henüz teklif başvurusu bulunmuyor. Public teklif formundan gelen başvurular burada listelenir."
        emptyTitle="Başvuru bulunamadı"
        rows={leads.map((lead) => [
          <div key={`${lead.id}-lead`}>
            <div className="font-semibold text-slate-950">
              {lead.companyName ?? lead.contactName}
            </div>
            <div className="text-xs text-slate-500">
              {lead.contactName} / {lead.contactEmail}
            </div>
          </div>,
          lead.items.length > 0
            ? lead.items
                .map((item) =>
                  item.vehicle
                    ? `${item.quantity}x ${item.vehicle.brand.name} ${item.vehicle.model.name}`
                    : `${item.quantity}x ${item.brandText ?? ""} ${item.modelText ?? ""}`,
                )
                .join(", ")
            : "-",
          <StatusBadge key={`${lead.id}-status`} status={lead.status} />,
          lead.assignedSalesRep?.name ?? "Atanmadi",
          `${lead.documents.length.toLocaleString("tr-TR")} belge`,
          `${lead.offers.length.toLocaleString("tr-TR")} teklif`,
          lead.updatedAt.toLocaleString("tr-TR"),
          <Button asChild key={`${lead.id}-action`} size="sm" variant="outline">
            <Link href={`/admin/basvurular/${lead.id}`}>Yönet</Link>
          </Button>,
        ])}
      />
    </div>
  );
}

function MetricCard({
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
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#fff2bf] text-[#765a0d]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
