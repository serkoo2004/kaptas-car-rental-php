import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = (await isDatabaseAvailable())
    ? await prisma.systemSetting.findMany({
        orderBy: { key: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Web, auth ve operasyon ayarlarının merkezi kayıtlarını izleyin."
        title="Ayarlar"
      />
      <AdminTable
        columns={["Anahtar", "Grup", "Son güncelleme"]}
        emptyDescription="Henüz sistem ayarı kaydı yok. Ayar servisleri aktif edildiğinde kayıtlar burada listelenir."
        emptyTitle="Ayar bulunamadi"
        rows={settings.map((setting) => [
          setting.key,
          setting.group,
          setting.updatedAt.toLocaleString("tr-TR"),
        ])}
      />
    </div>
  );
}
