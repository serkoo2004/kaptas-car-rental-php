import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/arac-filosu", label: "Araç Filosu" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/kiralama-kosullari", label: "Kiralama Koşulları" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#212529] shadow-sm">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link className="brand-logo-frame brand-logo-frame--compact -ml-1 min-[1400px]:-ml-[54px]" href="/">
          <Image className="brand-logo-image" height={1024} priority src="/logo.png" unoptimized width={1536} alt="KAPTAŞ Car Rental" />
        </Link>

        <div className="hidden items-center gap-5 text-xs font-bold text-white/75 md:flex">
          <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-amber-400" /> Güvenli bağlantı</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> iyzico 3D Secure</span>
        </div>

        <Button asChild className="bg-primary text-primary-foreground hover:bg-amber-500">
          <Link href="/arac-filosu">
            <span className="sm:hidden">Araçlar</span>
            <span className="hidden sm:inline">Araçları İncele</span>
            <ArrowRight className="hidden h-4 w-4 sm:block" />
          </Link>
        </Button>
      </div>

      <div className="border-b-2 border-amber-400 bg-[#212529]">
        <nav className="mx-auto hidden h-11 max-w-7xl items-center justify-center gap-8 px-4 text-sm font-semibold text-[#f8f9fa] lg:flex">
          {navItems.map((item) => (
            <Link
              className="flex h-full items-center border-b-2 border-transparent px-1 transition hover:border-amber-400 hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
