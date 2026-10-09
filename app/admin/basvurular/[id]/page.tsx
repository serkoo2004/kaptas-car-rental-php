import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  addLeadNote,
  assignLead,
  createLeadOffer,
  updateLeadStatus,
} from "@/app/admin/basvurular/[id]/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge, statusLabel } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const statusOptions = [
  "RECEIVED",
  "REVIEWING",
  "WAITING_DOCUMENTS",
  "PREPARING_OFFER",
  "OFFER_SENT",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CONTRACT_STAGE",
  "DELIVERY_PLANNED",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await isDatabaseAvailable())) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          description="Başvuru detaylarını yönetmek için veritabanı bağlantısı gereklidir."
          title="Başvuru detayı"
        />
        <EmptyState
          description="Veritabanı bağlantısı kurulduğunda başvuru detayları burada yönetilir."
          title="Veritabanı bağlantısı hazır değil"
        />
      </div>
    );
  }

  const [lead, salesReps] = await Promise.all([
    prisma.quoteRequest
      .findUnique({
        include: {
          assignedSalesRep: true,
          company: true,
          documents: {
            orderBy: { createdAt: "desc" },
          },
          items: {
            include: {
              vehicle: {
                include: {
                  brand: true,
                  model: true,
                  packages: {
                    orderBy: [{ durationMonths: "asc" }, { annualKm: "asc" }],
                  },
                },
              },
            },
          },
          notes: {
            include: { author: true },
            orderBy: { createdAt: "desc" },
          },
          offers: {
            include: { items: true },
            orderBy: { createdAt: "desc" },
          },
          requester: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
          },
        },
        where: { id },
      })
      .catch(() => null),
    prisma.user
      .findMany({
        orderBy: { name: "asc" },
        select: { email: true, id: true, name: true, role: true },
        where: {
          role: {
            in: ["SALES_REP", "ADMIN", "SUPER_ADMIN"],
          },
          status: "ACTIVE",
        },
      })
      .catch(() => []),
  ]);

  if (!lead) {
    notFound();
  }

  const activities = await prisma.customerActivity
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      where: {
        OR: [
          { quoteRequestId: lead.id },
          ...(lead.userId ? [{ userId: lead.userId }] : []),
        ],
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AdminPageHeader
          description={`${lead.contactName} başvurusu, ${lead.source} kaynağı.`}
          title={lead.companyName ?? lead.contactName}
        />
        <div className="flex items-center gap-3">
          <StatusBadge status={lead.status} />
          <Button asChild variant="outline">
            <Link href="/admin/basvurular">Listeye dön</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri özeti</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Yetkili" value={lead.contactName} />
              <Info label="Email" value={lead.contactEmail} />
              <Info label="Telefon" value={lead.contactPhone} />
              <Info label="Firma" value={lead.companyName} />
              <Info label="Kullanıcı tipi" value={lead.userType} />
              <Info
                label="Atanan temsilci"
                value={lead.assignedSalesRep?.name ?? lead.assignedSalesRep?.email}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Araç ihtiyacı</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminTable
                columns={["Araç", "Adet", "Süre", "Km"]}
                emptyDescription="Başvuruya bağlı araç kalemi bulunmuyor."
                emptyTitle="Araç ihtiyacı yok"
                rows={lead.items.map((item) => [
                  item.vehicle
                    ? `${item.vehicle.brand.name} ${item.vehicle.model.name}`
                    : [item.brandText, item.modelText].filter(Boolean).join(" "),
                  item.quantity,
                  item.durationMonths ? `${item.durationMonths} ay` : "-",
                  item.annualKm ? `${item.annualKm.toLocaleString("tr-TR")} km` : "-",
                ])}
              />
              {lead.note ? (
                <div className="mt-4 rounded-md border bg-surface-muted p-4 text-sm leading-6 text-foreground/70">
                  {lead.note}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Teklifler</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTable
                  columns={["Baslik", "Kalem", "Tutar", "Durum", "Gecerlilik"]}
                  emptyDescription="Bu başvuru için teklif oluşturulmadı."
                  emptyTitle="Teklif yok"
                  rows={lead.offers.map((offer) => [
                    offer.title,
                    `${offer.items.length.toLocaleString("tr-TR")} kalem`,
                    offer.totalMonthly
                      ? `${Number(offer.totalMonthly).toLocaleString("tr-TR")} TL`
                      : "-",
                    offer.status,
                    offer.validUntil?.toLocaleDateString("tr-TR") ?? "-",
                  ])}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Belgeler</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTable
                  columns={["Belge", "Tip", "Durum"]}
                  emptyDescription="Bu başvuru için belge yüklenmedi."
                  emptyTitle="Belge yok"
                  rows={lead.documents.map((document) => [
                    document.title,
                    document.type,
                    document.status,
                  ])}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Teklif oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createLeadOffer} className="space-y-5">
                <input name="quoteRequestId" type="hidden" value={lead.id} />
                <div className="grid gap-4 md:grid-cols-[1fr_140px_150px]">
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                    <span>Teklif basligi</span>
                    <Input
                      defaultValue={`${lead.companyName ?? lead.contactName} filo teklifi`}
                      name="title"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                    <span>Gecerlilik</span>
                    <Input defaultValue={14} min={1} name="validDays" type="number" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                    <span>Durum</span>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5ab31]"
                      defaultValue="DRAFT"
                      name="status"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Gonderildi</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-4">
                  {lead.items.map((item) => {
                    const vehicleTitle = item.vehicle
                      ? `${item.vehicle.brand.name} ${item.vehicle.model.name}`
                      : [item.brandText, item.modelText].filter(Boolean).join(" ");
                    const suggestedPackage = choosePackage({
                      annualKm: item.annualKm,
                      durationMonths: item.durationMonths,
                      packages: item.vehicle?.packages ?? [],
                    });
                    const suggestedPrice = Number(
                      suggestedPackage?.monthlyPrice ??
                        item.vehicle?.monthlyPriceFrom ??
                        0,
                    );
                    const serviceText = servicesToText(
                      suggestedPackage?.includedServices,
                    );

                    return (
                      <div
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        key={item.id}
                      >
                        <input name="itemId" type="hidden" value={item.id} />
                        <input
                          name={`vehicleTitle_${item.id}`}
                          type="hidden"
                          value={vehicleTitle || "Araç"}
                        />
                        <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-slate-950">
                              {vehicleTitle || "Manuel araç talebi"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Oneri: {suggestedPackage?.name ?? "Katalog fiyati"}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-700">
                            {(suggestedPrice * item.quantity).toLocaleString(
                              "tr-TR",
                            )}{" "}
                            TL / ay
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <Field label="Adet">
                            <Input
                              defaultValue={item.quantity}
                              min={1}
                              name={`quantity_${item.id}`}
                              type="number"
                            />
                          </Field>
                          <Field label="Sure">
                            <Input
                              defaultValue={item.durationMonths ?? 36}
                              min={1}
                              name={`durationMonths_${item.id}`}
                              type="number"
                            />
                          </Field>
                          <Field label="Yillik km">
                            <Input
                              defaultValue={item.annualKm ?? 20000}
                              min={1000}
                              name={`annualKm_${item.id}`}
                              type="number"
                            />
                          </Field>
                          <Field label="Aylik birim fiyat">
                            <Input
                              defaultValue={suggestedPrice.toFixed(0)}
                              name={`monthlyPrice_${item.id}`}
                            />
                          </Field>
                          <Field className="md:col-span-4" label="Hizmet kapsami">
                            <Textarea
                              defaultValue={
                                serviceText ||
                                "Periyodik bakım\nLastik yönetimi\nSigorta ve hasar koordinasyonu\nYol yardımı"
                              }
                              name={`services_${item.id}`}
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d5ab31] bg-[#fff8df] p-4">
                  <div>
                    <div className="text-sm font-bold text-slate-950">
                      Teklif toplamı kayıt anında yeniden hesaplanır.
                    </div>
                    <div className="text-xs text-slate-600">
                      Admin revizyonlari audit log ve teklif listesine islenir.
                    </div>
                  </div>
                  <Button size="lg" type="submit">
                    Teklifi oluştur
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                emptyDescription="Bu müşteri veya başvuru için aktivite kaydı yok."
                items={activities.map((activity) => ({
                  body: activity.path ?? activity.type,
                  meta: activity.createdAt.toLocaleString("tr-TR"),
                  title: activity.type,
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum güncelle</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateLeadStatus} className="space-y-4">
                <input name="quoteRequestId" type="hidden" value={lead.id} />
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Durum</span>
                  <select
                    className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={lead.status}
                    name="status"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Durum notu</span>
                  <Textarea name="note" />
                </label>
                <Button className="w-full" type="submit">
                  Durumu Güncelle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temsilci ata</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={assignLead} className="space-y-4">
                <input name="quoteRequestId" type="hidden" value={lead.id} />
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Satis temsilcisi</span>
                  <select
                    className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={lead.assignedSalesRepId ?? ""}
                    name="salesRepId"
                  >
                    <option value="">Atama yok</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name ?? rep.email} / {rep.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Atama notu</span>
                  <Textarea name="assignmentNote" />
                </label>
                <Button className="w-full" type="submit">
                  Temsilciyi Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ic not ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addLeadNote} className="space-y-4">
                <input name="quoteRequestId" type="hidden" value={lead.id} />
                <Textarea name="body" required />
                <Button className="w-full" type="submit">
                  Notu Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                emptyDescription="Bu başvuru için iç not yok."
                items={lead.notes.map((note) => ({
                  body: note.body,
                  meta: `${note.author.name ?? note.author.email} / ${note.createdAt.toLocaleString("tr-TR")}`,
                  title: "Ic not",
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Durum gecmisi</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                emptyDescription="Durum gecmisi kaydi yok."
                items={lead.statusHistory.map((item) => ({
                  body: item.note ?? `${statusLabel(item.fromStatus ?? "-")} -> ${statusLabel(item.toStatus)}`,
                  meta: item.createdAt.toLocaleString("tr-TR"),
                  title: statusLabel(item.toStatus),
                }))}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-surface-muted px-4 py-3">
      <div className="text-xs font-semibold text-foreground/50">{label}</div>
      <div className="mt-1 font-medium">{value || "-"}</div>
    </div>
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

function choosePackage({
  packages,
  durationMonths,
  annualKm,
}: {
  packages: Array<{
    annualKm: number;
    durationMonths: number;
    includedServices: unknown;
    isActive: boolean;
    monthlyPrice: unknown;
    name: string | null;
  }>;
  durationMonths?: number | null;
  annualKm?: number | null;
}) {
  const activePackages = packages.filter((item) => item.isActive);

  if (activePackages.length === 0) {
    return null;
  }

  const targetDuration = durationMonths ?? 36;
  const targetKm = annualKm ?? 20000;

  return [...activePackages].sort((left, right) => {
    const leftScore =
      Math.abs(left.durationMonths - targetDuration) * 1000 +
      Math.abs(left.annualKm - targetKm);
    const rightScore =
      Math.abs(right.durationMonths - targetDuration) * 1000 +
      Math.abs(right.annualKm - targetKm);

    return leftScore - rightScore;
  })[0];
}

function servicesToText(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).join("\n");
  }

  return "";
}

function Timeline({
  items,
  emptyDescription,
}: {
  items: Array<{ title: string; body: string; meta: string }>;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border bg-surface-muted p-4 text-sm text-foreground/60">
        {emptyDescription}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div className="border-l-2 border-accent/30 pl-4" key={`${item.title}-${index}`}>
          <div className="text-sm font-semibold">{item.title}</div>
          <div className="mt-1 text-sm leading-6 text-foreground/65">{item.body}</div>
          <div className="mt-1 text-xs text-foreground/45">{item.meta}</div>
        </div>
      ))}
    </div>
  );
}
