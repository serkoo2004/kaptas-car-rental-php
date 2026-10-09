import {
  AdminMobileNav,
  AdminSidebar,
} from "@/components/admin/admin-sidebar";
import { KaptasLogo } from "@/components/brand/kaptas-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <AdminSidebar />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
          <KaptasLogo className="lg:hidden" compact priority />
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Operasyon Kontrol Merkezi
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Satış, araç ve belge süreçleri
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="hidden items-center gap-2 xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Canlı sistem
            </div>
            {userName ? (
              <span className="hidden max-w-48 truncate font-medium text-slate-800 md:block">
                {userName}
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </header>
        <AdminMobileNav />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
