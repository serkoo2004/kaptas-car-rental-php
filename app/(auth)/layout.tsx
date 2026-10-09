import Link from "next/link";
import { KaptasLogo } from "@/components/brand/kaptas-logo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f0] text-[#292929]">
      <header className="border-b border-[#ddddda] bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-4 sm:px-6">
          <Link aria-label="KAPTAŞ ana sayfa" className="flex items-center" href="/">
            <KaptasLogo priority />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="pb-6 text-center text-xs text-[#888]">
        KAPTAŞ güvenli hesap erişimi
      </footer>
    </div>
  );
}
