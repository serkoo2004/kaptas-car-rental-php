import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CarFront,
  ClipboardList,
  FilePlus2,
  FileClock,
  LineChart,
  Plus,
  Settings2,
} from "lucide-react";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

const operationCards = [
  {
    description: "Yeni araç, günlük USD fiyatı, stok ve yayın durumunu yönetin.",
    href: "/admin/araclar",
    icon: CarFront,
    title: "Araç kataloğu",
  },
  {
    description: "Gelen talepleri inceleyin, satış temsilcisi atayın.",
    href: "/admin/basvurular",
    icon: ClipboardList,
    title: "Lead yönetimi",
  },
  {
    description: "Müşteri evraklarını kontrol edip onay akışını ilerletin.",
    href: "/admin/belgeler",
    icon: FilePlus2,
    title: "Belge onayı",
  },
  {
    description: "Sistem kullanıcıları, roller ve operasyon ayarları.",
    href: "/admin/ayarlar",
    icon: Settings2,
    title: "Ayarlar",
  },
];

async function getDashboardData() {
  if (!(await isDatabaseAvailable())) {
    return {
      activities: [],
      documents: [],
      leads: [],
      metrics: {
        activeVehicles: 0,
        averageDailyPrice: 0,
        newLeads: 0,
        offersSent: 0,
        pendingDocuments: 0,
        stockCount: 0,
        todaysActivity: 0,
      },
      pipeline: [],
    };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    newLeads,
    offersSent,
    pendingDocuments,
    todaysActivity,
    activeVehicles,
    vehicleStock,
    averageDailyPrice,
    pipeline,
    leads,
    documents,
    activities,
  ] =
    await Promise.all([
      prisma.quoteRequest.count({
        where: {
          status: "RECEIVED",
        },
      }),
      prisma.quoteRequest.count({
        where: {
          status: "OFFER_SENT",
        },
      }),
      prisma.document.count({
        where: {
          status: {
            in: ["REQUESTED", "UPLOADED"],
          },
        },
      }),
      prisma.customerActivity.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.vehicle.count({
        where: {
          status: "PUBLISHED",
          isPublishedWeb: true,
        },
      }),
      prisma.vehicle.aggregate({
        _sum: { stockCount: true },
      }),
      prisma.vehicle.aggregate({
        _avg: { dailyPrice: true },
        where: {
          dailyPrice: { not: null },
          isPublishedWeb: true,
          status: "PUBLISHED",
        },
      }),
      prisma.quoteRequest.groupBy({
        _count: true,
        by: ["status"],
      }),
      prisma.quoteRequest.findMany({
        include: {
          assignedSalesRep: true,
          items: {
            include: {
              vehicle: {
                include: { brand: true, model: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.document.findMany({
        include: {
          company: true,
          quoteRequest: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        where: {
          status: {
            in: ["REQUESTED", "UPLOADED", "REJECTED"],
          },
        },
      }),
      prisma.customerActivity.findMany({
        include: { user: true, vehicle: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  return {
    activities,
    documents,
    leads,
    metrics: {
      activeVehicles,
      averageDailyPrice: Number(averageDailyPrice._avg.dailyPrice ?? 0),
      newLeads,
      offersSent,
      pendingDocuments,
      stockCount: vehicleStock._sum.stockCount ?? 0,
      todaysActivity,
    },
    pipeline,
  };
}

export default async function AdminHomePage() {
  const data = await getDashboardData();
  const pipelineMap = new Map<string, number>(
    data.pipeline.map((item) => [item.status, item._count]),
  );
  const pipelineStages = [
    ["RECEIVED", "Yeni"],
    ["REVIEWING", "Inceleme"],
    ["PREPARING_OFFER", "Teklif"],
    ["WAITING_DOCUMENTS", "Evrak"],
    ["CONTRACT_STAGE", "Sozlesme"],
    ["DELIVERY_PLANNED", "Teslimat"],
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d5ab31]">
              Kiralama operasyon masası
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-normal">
              Araç, lead, ödeme ve belge akışını tek panelden yönetin.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Satın alma butonundan gelen talepler, araç yayın durumu,
              günlük fiyatlar, stok ve belge kontrolü aynı operasyon ekranında.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/admin/basvurular">Başvuruları yönet</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/araclar/yeni">
                  <Plus className="h-4 w-4" />
                  Araç ekle
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/8 p-5">
            <div className="text-sm font-semibold text-slate-300">
              Bugünkü operasyon sinyali
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <HeroSignal label="Yeni lead" value={data.metrics.newLeads} />
              <HeroSignal label="Aktivite" value={data.metrics.todaysActivity} />
              <HeroSignal label="Evrak" value={data.metrics.pendingDocuments} />
              <HeroSignal label="Teklif" value={data.metrics.offersSent} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Yeni başvuru"
          value={data.metrics.newLeads}
        />
        <MetricCard
          icon={<FileClock className="h-5 w-5" />}
          label="Belge kuyruğu"
          value={data.metrics.pendingDocuments}
        />
        <MetricCard
          icon={<CarFront className="h-5 w-5" />}
          label="Yayındaki araç"
          value={data.metrics.activeVehicles}
          subValue={`${data.metrics.stockCount.toLocaleString("tr-TR")} stok`}
        />
        <MetricCard
          icon={<LineChart className="h-5 w-5" />}
          label="Ort. günlük fiyat"
          value={`${Math.round(data.metrics.averageDailyPrice).toLocaleString("tr-TR")} USD`}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {operationCards.map((card) => (
          <OperationCard card={card} key={card.href} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead pipeline</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/basvurular">
                  Tumunu ac <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-6">
                {pipelineStages.map(([status, label]) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={status}
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-slate-950">
                      {(pipelineMap.get(status) ?? 0).toLocaleString("tr-TR")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Sıcak başvurular</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.leads.length > 0 ? (
                data.leads.map((lead) => (
                  <Link
                    className="grid gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-[#d5ab31] hover:bg-[#fff8df]/55 md:grid-cols-[1fr_140px_120px]"
                    href={`/admin/basvurular/${lead.id}`}
                    key={lead.id}
                  >
                    <div>
                      <div className="font-semibold text-slate-950">
                        {lead.companyName ?? lead.contactName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {lead.items[0]?.vehicle
                          ? `${lead.items[0].vehicle.brand.name} ${lead.items[0].vehicle.model.name}`
                          : lead.contactEmail}
                      </div>
                    </div>
                    <StatusBadge status={lead.status} />
                    <div className="text-sm font-semibold text-slate-500">
                      {lead.assignedSalesRep?.name ?? "Atanmadı"}
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyAdminState
                  actionHref="/admin/basvurular"
                  actionLabel="Başvuruları aç"
                  text="Henüz sıcak başvuru yok. Yeni talepler geldiğinde burada öncelikli olarak görünür."
                  title="Kuyruk temiz"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Belge onay kuyruğu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.documents.length > 0 ? (
                data.documents.map((document) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={document.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">
                          {document.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {document.company?.name ??
                            document.quoteRequest?.companyName ??
                            document.user?.email ??
                            "Müşteri"}
                        </div>
                      </div>
                      <StatusBadge status={document.status} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyAdminState
                  actionHref="/admin/belgeler"
                  actionLabel="Belgeleri aç"
                  text="Kontrol bekleyen belge bulunmuyor."
                  title="Belge kuyruğu boş"
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Son müşteri aktiviteleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activities.length > 0 ? (
                data.activities.map((activity) => (
                  <div className="flex gap-3" key={activity.id}>
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#fff2bf] text-[#765a0d]">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {activity.type}
                      </div>
                      <div className="text-xs leading-5 text-slate-500">
                        {activity.user?.email ??
                          activity.vehicle?.title ??
                          activity.path ??
                          "Anonim aktivite"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyAdminState
                  actionHref="/admin/aktiviteler"
                  actionLabel="Aktiviteleri aç"
                  text="Müşteri hareketleri oluştuğunda burada zaman sırasıyla görünür."
                  title="Henüz aktivite yok"
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function OperationCard({
  card,
}: {
  card: {
    description: string;
    href: string;
    icon: LucideIcon;
    title: string;
  };
}) {
  const Icon = card.icon;

  return (
    <Link
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d5ab31] hover:shadow-md"
      href={card.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-[#fff2bf] text-[#765a0d]">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#765a0d]" />
      </div>
      <h2 className="mt-5 text-base font-bold text-slate-950">{card.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
    </Link>
  );
}

function EmptyAdminState({
  actionHref,
  actionLabel,
  text,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  text: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <CalendarCheck className="mx-auto h-6 w-6 text-[#765a0d]" />
      <div className="mt-3 font-semibold text-slate-950">{title}</div>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {text}
      </p>
      <Button asChild className="mt-4" size="sm" variant="outline">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function HeroSignal({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-3xl font-bold">{value.toLocaleString("tr-TR")}</div>
      <div className="mt-1 text-xs font-semibold text-slate-400">{label}</div>
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
  value: number | string;
  subValue?: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">
            {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
          </div>
          {subValue ? (
            <div className="mt-1 text-xs font-semibold text-slate-500">
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
