import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import { getBootstrapBlogPosts } from "@/lib/vehicles/bootstrap-catalog";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getPost>> | ReturnType<typeof getBootstrapBlogPosts>[number] | null =
    null;

  if (await isDatabaseAvailable()) {
    try {
      post = await getPost(slug);
    } catch {
      post = null;
    }
  }

  post ??= getBootstrapBlogPosts().find((item) => item.slug === slug) ?? null;

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-background">
      <section className="border-b border-red-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Button
            asChild
            className="border-red-200 bg-white text-primary hover:border-red-500 hover:text-red-600"
            variant="outline"
          >
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
              Rehbere don
            </Link>
          </Button>
          <article className="animate-reveal-up mt-8">
            <p className="text-sm font-semibold text-red-600">
              {post.category?.name ?? "Filo rehberi"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal text-primary sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-5 text-base leading-8 text-foreground/66">
                {post.excerpt}
              </p>
            ) : null}
            <div className="mt-5 flex items-center gap-2 text-sm text-foreground/52">
              <Clock className="h-4 w-4" />
              {post.readingMinutes ?? 4} dk okuma
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-lg border border-red-200 bg-surface p-6 leading-8 text-foreground/75 shadow-sm">
          {post.content}
        </article>
        <div className="rounded-lg border border-red-200 bg-surface p-6 shadow-sm md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Arac ihtiyaciniz icin hizli donus alin
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/65">
              Okudugunuz konuya gore arac tipi, tarih ve teslim noktasini
              iletin.
            </p>
          </div>
          <Button asChild className="mt-5 bg-accent hover:bg-accent/90 md:mt-0">
            <Link href="/iletisim">
              Iletisime gec
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    include: { category: true },
    where: {
      isPublished: true,
      slug,
    },
  });
}
