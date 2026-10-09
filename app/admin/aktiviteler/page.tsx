import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const activities = (await isDatabaseAvailable())
    ? await prisma.customerActivity.findMany({
        include: { user: true, vehicle: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Musteri davranislarini satis niyeti ve operasyon takibi icin izleyin."
        title="Aktiviteler"
      />
      <AdminTable
        columns={["Tip", "Kullanıcı", "Araç", "Sayfa", "Tarih"]}
        emptyDescription="Henüz aktivite kaydı yok. Public web ve panel olayları kaydedildikçe burada görünür."
        emptyTitle="Aktivite bulunamadi"
        rows={activities.map((activity) => [
          activity.type,
          activity.user?.email ?? activity.anonymousId,
          activity.vehicle?.title,
          activity.path,
          activity.createdAt.toLocaleString("tr-TR"),
        ])}
      />
    </div>
  );
}
