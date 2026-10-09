import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Araç Kiralama",
    template: "%s | Araç Kiralama",
  },
  description:
    "Online araç seçimi, rezervasyon ve güvenli ödeme deneyimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
