import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";

export const dynamic = "force-dynamic";

export default async function PurchaseResultPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const paymentIntent =
    id && (await isDatabaseAvailable())
      ? await prisma.paymentIntent.findUnique({ where: { id } })
      : null;
  const isPaid =
    paymentIntent?.status === "PAID" &&
    paymentIntent.provider === "iyzico" &&
    Boolean(paymentIntent.providerRef);
  const requiresReview = paymentIntent?.status === "REVIEW_REQUIRED";

  return (
    <div className="bg-background">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isPaid || requiresReview ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>
            {isPaid ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : requiresReview ? (
              <Clock3 className="h-7 w-7" />
            ) : (
              <XCircle className="h-7 w-7 text-red-600" />
            )}
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-primary">
            {isPaid
              ? "Ödeme başarılı, rezervasyon onaylandı"
              : requiresReview
                ? "Ödemeniz alındı, rezervasyon kontrol ediliyor"
                : "Ödeme doğrulanamadı"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/62">
            {isPaid
              ? "Iyzico ödeme doğrulaması tamamlandı. Operasyon ekibi teslim detayı için sizinle iletişime geçecek."
              : requiresReview
                ? "Ödeme doğrulandı ancak araç müsaitliği operasyon ekibi tarafından yeniden kontrol ediliyor. Ekibimiz sizinle iletişime geçecek."
                : "Iyzico tarafından doğrulanmış başarılı bir ödeme bulunamadı. Rezervasyon oluşturulmadı."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link href="/arac-filosu">Araçlara dön</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/iletisim">İletişim</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
