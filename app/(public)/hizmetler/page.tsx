import Link from "next/link";
import { ArrowRight, BatteryCharging, CarFront, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { getBootstrapServices } from "@/lib/vehicles/bootstrap-catalog";

export const dynamic = "force-dynamic";

const icons = [CarFront, Wrench, BatteryCharging];

export default async function ServicesPage() {
  let services: Awaited<ReturnType<typeof getServices>> | ReturnType<typeof getBootstrapServices> =
    [];

  if (await isDatabaseAvailable()) {
    try {
      services = await getServices();
    } catch {
      services = [];
    }
  }

  if (services.length === 0) {
    services = getBootstrapServices();
  }

  return (
    <div className="bg-background">
      <section className="border-b bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="animate-reveal-up max-w-3xl">
            <p className="text-sm font-semibold text-accent">Hizmet yapisi</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Kiralama, operasyon ve elektrikli filo gecisi ayni akista.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/66">
              Public web tarafinda hizmetler satis diliyle anlatilir; admin
              panelde ayni kapsam teklif ve operasyon sureclerine baglanir.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[index % icons.length];

            return (
              <Link
                className={`hover-lift animate-reveal-up rounded-lg border bg-surface p-6 shadow-sm ${
                  index === 1 ? "motion-delay-1" : index === 2 ? "motion-delay-2" : ""
                }`}
                href={`/hizmetler/${service.slug}`}
                key={service.id}
              >
                <Icon className="h-6 w-6 text-accent" />
                <h2 className="mt-8 text-xl font-semibold text-primary">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-foreground/65">
                  {service.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  Incele
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border bg-surface p-6 shadow-sm md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Hizmet kapsamindan teklif akisine gecin
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/65">
              Arac adedi, sure ve kilometre ihtiyacinizi ilettiginizde satis
              ekibi uygun paketleri hazirlar.
            </p>
          </div>
          <Button asChild className="mt-5 bg-accent hover:bg-accent/90 md:mt-0">
            <Link href="/teklif-al">
              Teklif Al
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function getServices() {
  return prisma.servicePage.findMany({
    orderBy: { title: "asc" },
    where: { isPublished: true },
  });
}
