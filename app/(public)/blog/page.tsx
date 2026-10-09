import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { getBootstrapBlogPosts } from "@/lib/vehicles/bootstrap-catalog";

export const dynamic = "force-dynamic";

const values = [
  "Şeffaf fiyat ve net rezervasyon adımı",
  "Bakımlı, sınıfına uygun araç seçenekleri",
  "Teslimat öncesi hızlı operasyon teyidi",
];

const newsItems = [
  {
    category: "Piyasa",
    icon: Newspaper,
    title: "Otomatik vites talebi şehir içi kiralamada yükseliyor",
    text: "Kısa dönem kiralamalarda konfor ve kullanım kolaylığı öne çıktığı için otomatik vites araçlar daha fazla tercih ediliyor.",
    date: "Güncel not",
  },
  {
    category: "Araç seçimi",
    icon: CarFront,
    title: "SUV ve crossover modeller aile kiralamalarında öne çıkıyor",
    text: "Bagaj hacmi, yüksek oturma pozisyonu ve uzun yol rahatlığı SUV segmentini dönemsel taleplerde güçlü hale getiriyor.",
    date: "Editör seçimi",
  },
  {
    category: "Güvenlik",
    icon: ShieldCheck,
    title: "3D Secure ödeme online rezervasyonda güven standardı oldu",
    text: "Kart bilgilerinin güvenli ödeme ekranında doğrulanması, online kiralama deneyimini daha kontrollü hale getiriyor.",
    date: "Ödeme rehberi",
  },
  {
    category: "Bakım",
    icon: Wrench,
    title: "Teslimat öncesi kontrol listesi müşteri deneyimini belirliyor",
    text: "Lastik, temizlik, yakıt, kilometre ve hasar kontrolü teslimat kalitesinin en görünür parçaları arasında.",
    date: "Operasyon",
  },
];

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getPosts>> | ReturnType<typeof getBootstrapBlogPosts> =
    [];

  if (await isDatabaseAvailable()) {
    try {
      posts = await getPosts();
    } catch {
      posts = [];
    }
  }

  if (posts.length === 0) {
    posts = getBootstrapBlogPosts();
  }

  return (
    <div className="bg-background">
      <section className="border-b border-red-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.45fr] lg:px-8">
          <div className="animate-reveal-up">
            <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-red-600">
              <span className="h-px w-10 bg-red-500" />
              <span>Biz kimiz?</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-primary sm:text-5xl">
              Araç kiralamayı daha hızlı, anlaşılır ve güvenli hale getiren
              dijital ekip.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/66">
              Müşterinin araç seçimi, teslimat bilgileri ve ödeme adımını
              tek ekranda tamamlayabildiği sade bir kiralama deneyimi
              tasarlıyoruz. Amacımız, araç arayan kişinin vakit kaybetmeden
              doğru sınıfı seçmesi ve rezervasyonu güvenli şekilde başlatması.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {values.map((value) => (
                <div
                  className="rounded-lg border border-red-100 bg-red-50/45 p-4 text-sm font-semibold leading-6 text-primary"
                  key={value}
                >
                  <CheckCircle2 className="mb-3 h-5 w-5 text-accent" />
                  {value}
                </div>
              ))}
            </div>
          </div>

          <aside className="animate-soft-scale rounded-lg border border-red-200 bg-white p-5 shadow-panel">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="mt-5 text-xl font-semibold text-primary">
              Yayın akışı
            </h2>
            <p className="mt-3 text-sm leading-7 text-foreground/62">
              Bu alanda araç seçimi, güvenli ödeme, teslimat hazırlığı ve
              kiralama sürecindeki güncel notları haber formatında paylaşıyoruz.
            </p>
            <div className="mt-5 rounded-md border border-red-100 bg-red-50/45 p-4">
              <div className="text-3xl font-semibold text-primary">
                {posts.length + newsItems.length}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase text-foreground/45">
                Aktif içerik
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">Güncel araç notları</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">
              Haber tadında kısa bilgiler
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600"
            href="/iletisim"
          >
            Araç ihtiyacınızı iletin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {newsItems.map((item, index) => (
            <NewsCard index={index} item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section className="border-t border-red-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-accent">Rehberler</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">
              Kiralama sürecini kolaylaştıran yazılar
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((post, index) => (
              <article
                className={`hover-lift animate-reveal-up rounded-lg border border-red-200 bg-surface p-6 shadow-sm ${
                  index === 1 ? "motion-delay-1" : index === 2 ? "motion-delay-2" : ""
                }`}
                key={post.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                    {post.category?.name ?? "Rehber"}
                  </span>
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-8 text-xl font-semibold leading-tight text-primary">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-foreground/65">
                  {post.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="flex items-center gap-2 text-foreground/55">
                    <Clock className="h-4 w-4" />
                    {post.readingMinutes ?? 4} dk
                  </span>
                  <Link
                    className="inline-flex items-center gap-2 font-semibold text-accent"
                    href={`/blog/${post.slug}`}
                  >
                    Oku
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function NewsCard({
  item,
  index,
}: {
  item: {
    category: string;
    date: string;
    icon: LucideIcon;
    text: string;
    title: string;
  };
  index: number;
}) {
  const Icon = item.icon;

  return (
    <article
      className={`hover-lift animate-reveal-up rounded-lg border border-red-200 bg-white p-5 shadow-sm ${
        index % 2 === 1 ? "motion-delay-1" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-100 px-2.5 py-1 text-xs font-semibold text-foreground/55">
          <CalendarDays className="h-3.5 w-3.5 text-red-600" />
          {item.date}
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase text-red-600">
        {item.category}
      </p>
      <h3 className="mt-2 text-xl font-semibold leading-tight text-primary">
        {item.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-foreground/64">{item.text}</p>
    </article>
  );
}

function getPosts() {
  return prisma.blogPost.findMany({
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    where: { isPublished: true },
  });
}
