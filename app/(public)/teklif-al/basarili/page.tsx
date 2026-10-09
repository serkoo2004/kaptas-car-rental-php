import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function QuoteSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState
        action={
          <Button asChild>
            <Link href="/araclar">Araclari incelemeye devam et</Link>
          </Button>
        }
        description="Basvurunuz satis ekibine iletildi. Bilgiler kontrol edildikten sonra teklif sureci baslatilir."
        title="Basvurunuz alindi"
      />
    </div>
  );
}
