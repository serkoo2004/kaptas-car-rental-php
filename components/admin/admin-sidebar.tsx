"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarClock,
  CarFront,
  ChevronRight,
  FileCheck2,
  FileText,
  LayoutDashboard,
  MapPin,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KaptasLogo } from "@/components/brand/kaptas-logo";

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/basvurular", label: "Başvurular", icon: FileText },
  { href: "/admin/teklifler", label: "Teklifler", icon: FileCheck2 },
  { href: "/admin/araclar", label: "Araçlar", icon: CarFront },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar", icon: CalendarClock },
  { href: "/admin/subeler", label: "Şubeler", icon: MapPin },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/admin/belgeler", label: "Belgeler", icon: FileCheck2 },
  { href: "/admin/aktiviteler", label: "Aktiviteler", icon: Activity },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#2c2c2c] bg-[#191919] text-white lg:block">
      <div className="flex h-20 items-center border-b border-white/10 bg-white px-5">
        <KaptasLogo compact priority />
      </div>
      <nav className="space-y-1 px-3 py-4">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
                isActive &&
                  "bg-[#d5ab31] text-[#191919] shadow-[0_10px_30px_rgba(213,171,49,0.18)] hover:bg-[#e0bb4d] hover:text-[#191919]",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      {adminNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600",
              isActive && "border-[#d5ab31] bg-[#fff8df] text-[#6f5510]",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {isActive ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
