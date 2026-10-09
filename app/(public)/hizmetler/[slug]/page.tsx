import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { getBootstrapServices } from "@/lib/vehicles/bootstrap-catalog";

export const dynamic = "force-dynamic";

const bullets = [
  "Teklif sureciyle bagli veri modeli",
  "Admin panelden takip edilebilir operasyon notlari",
  "Mobil uygulama icin ayni API mimarisine hazir yapi",
];

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let service: Awaited<ReturnType<typeof getService>> | ReturnType<typeof getBootstrapServices>[number] | null =
    null;

  if (await isDatabaseAvailable()) {
    try {
      service = await getService(slug);
    } catch {
      service = null;
    }
  }

  service ??= getBootstrapServices().find((item) => item.slug === slug) ?? null;

  if (!service) {
    notFound();
  }

  return (
    <div className="bg-background">
      <section className="border-b bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Button
            asChild
            className="border-white/18 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            variant="outline"
          >
            <Link href="/hizmetler">
              <ArrowLeft className="h-4 w-4" />
              Hizmetlere don
            </Link>
          </Button>
          <div className="animate-reveal-up mt-8 max-w-3xl">
            <p className="text-sm font-semibold text-accent">Hizmet</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              {service.title}
            </h1>
            {service.excerpt ? (
              <p className="mt-5 text-base leading-8 text-white/68">
                {service.excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <article className="rounded-lg border bg-surface p-6 shadow-sm">
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-foreground/75">
            {service.content}
          </div>
          <div className="mt-8 grid gap-3">
            {bullets.map((item) => (
              <div className="flex items-center gap-3 text-sm" key={item}>
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-lg border bg-surface p-5 shadow-panel lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-lg font-semibold text-primary">
            Bu kapsam icin teklif alin
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/65">
            Arac adedi, sure ve kilometre ihtiyaciniza gore teklif akisi
            baslatilir.
          </p>
          <Button asChild className="mt-6 w-full bg-accent hover:bg-accent/90">
            <Link href="/teklif-al">
              Teklif Al
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function getService(slug: string) {
  return prisma.servicePage.findFirst({
    where: {
      isPublished: true,
      slug,
    },
  });
}
