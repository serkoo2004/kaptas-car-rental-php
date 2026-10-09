import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = (await isDatabaseAvailable())
    ? await prisma.user.findMany({
        include: { company: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Web ve ileride mobil uygulama kullanıcılarını rol ve durum bilgisiyle izleyin."
        title="Kullanıcılar"
      />
      <AdminTable
        columns={["Ad", "Email", "Rol", "Durum", "Firma"]}
        emptyDescription="Henüz kullanıcı kaydı bulunmuyor. Kayıt ve admin kullanıcı akışlarıyla liste dolacaktır."
        emptyTitle="Kullanıcı bulunamadı"
        rows={users.map((user) => [
          user.name,
          user.email,
          user.role,
          user.status,
          user.company?.name,
        ])}
      />
    </div>
  );
}
