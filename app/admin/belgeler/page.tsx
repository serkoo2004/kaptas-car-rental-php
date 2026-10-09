import { approveDocument, rejectDocument } from "@/app/admin/belgeler/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const documents = (await isDatabaseAvailable())
    ? await prisma.document.findMany({
        include: { company: true, quoteRequest: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];
  const waitingCount = documents.filter((document) =>
    ["REQUESTED", "UPLOADED"].includes(document.status),
  ).length;
  const approvedCount = documents.filter(
    (document) => document.status === "APPROVED",
  ).length;
  const rejectedCount = documents.filter(
    (document) => document.status === "REJECTED",
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Kullanıcı, firma ve teklif başvurularına bağlı belgeleri onaylayın, reddedin ve operasyon kuyruğunu yönetin."
        title="Belge onay merkezi"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <QueueCard label="Onay bekleyen" value={waitingCount} tone="warning" />
        <QueueCard label="Onaylanan" value={approvedCount} tone="success" />
        <QueueCard label="Revizyon isteyen" value={rejectedCount} tone="danger" />
      </div>

      <AdminTable
        columns={[
          "Belge",
          "Musteri",
          "Tip",
          "Durum",
          "Yukleme",
          "Revizyon notu",
          "Aksiyon",
        ]}
        emptyDescription="Henüz belge yüklenmedi. Kullanıcı belge yüklediğinde onay süreci burada başlar."
        emptyTitle="Belge bulunamadi"
        rows={documents.map((document) => [
          <div key={`${document.id}-title`}>
            <div className="font-semibold text-slate-950">{document.title}</div>
            <div className="text-xs text-slate-500">
              {document.fileName ?? document.fileUrl}
            </div>
          </div>,
          document.company?.name ??
            document.quoteRequest?.companyName ??
            document.user?.email ??
            "-",
          document.type,
          <StatusBadge key={`${document.id}-status`} status={document.status} />,
          document.createdAt.toLocaleString("tr-TR"),
          document.rejectionReason ?? "-",
          <div className="flex min-w-72 flex-col gap-2" key={`${document.id}-actions`}>
            <form action={approveDocument}>
              <input name="documentId" type="hidden" value={document.id} />
              <Button
                className="w-full"
                disabled={document.status === "APPROVED"}
                size="sm"
                type="submit"
              >
                Onayla
              </Button>
            </form>
            <form action={rejectDocument} className="flex gap-2">
              <input name="documentId" type="hidden" value={document.id} />
              <Input
                name="rejectionReason"
                placeholder="Eksik imza, okunmuyor..."
              />
              <Button size="sm" type="submit" variant="outline">
                Reddet
              </Button>
            </form>
          </div>,
        ])}
      />
    </div>
  );
}

function QueueCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "danger"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">
            {value.toLocaleString("tr-TR")}
          </div>
        </div>
        <span className={`h-10 w-10 rounded-md ${toneClass}`} />
      </CardContent>
    </Card>
  );
}
