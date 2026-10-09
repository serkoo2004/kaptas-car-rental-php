import Image from "next/image";
import Link from "next/link";
import { Headphones, Mail, MapPin } from "lucide-react";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/arac-filosu", label: "Araç Filosu" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/kiralama-kosullari", label: "Kiralama Koşulları" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-amber-300 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.7fr_0.7fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-logo-frame">
              <Image className="brand-logo-image" height={1024} src="/logo.png" unoptimized width={1536} alt="KAPTAŞ Car Rental" />
            </span>
            <div>
              <div className="font-semibold text-foreground">KAPTAŞ Car Rental</div>
              <div className="mt-1 text-xs uppercase text-foreground/45">
                Güvenli online rezervasyon
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-foreground/60">
            Araç seçimi, teslimat bilgileri ve 3D Secure ödeme akışını tek
            ekranda toplayan sade kiralama deneyimi.
          </p>
        </div>

        <nav className="grid content-start gap-3 text-sm font-semibold text-foreground/62">
          <div className="text-xs uppercase text-foreground/40">Menü</div>
          {links.map((link) => (
            <Link
              className="transition hover:text-amber-700"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="grid content-start gap-3 text-sm text-foreground/62">
          <div className="text-xs font-semibold uppercase text-foreground/40">
            İletişim
          </div>
          <a
            className="flex items-center gap-2 transition hover:text-amber-700"
            dir="ltr"
            href="tel:+905550456261"
          >
            <Headphones className="h-4 w-4 text-accent" />
            0 (555) 045 62 61
          </a>
          <a
            className="flex items-center gap-2 break-all transition hover:text-amber-700"
            href="mailto:kaptascarrental@gmail.com"
          >
            <Mail className="h-4 w-4 text-accent" />
            kaptascarrental@gmail.com
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            Havalimanı ve adres teslim
          </span>
        </div>
      </div>
    </footer>
  );
}
