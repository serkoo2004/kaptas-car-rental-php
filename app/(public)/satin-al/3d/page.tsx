import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";

export const dynamic = "force-dynamic";

export default async function ThreeDsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id || !(await isDatabaseAvailable())) {
    notFound();
  }

  const paymentIntent = await prisma.paymentIntent.findUnique({
    where: { id },
  });

  if (
    !paymentIntent ||
    paymentIntent.provider !== "iyzico" ||
    paymentIntent.status !== "PENDING"
  ) {
    notFound();
  }

  const metadata =
    paymentIntent.metadata &&
    typeof paymentIntent.metadata === "object" &&
    !Array.isArray(paymentIntent.metadata)
      ? (paymentIntent.metadata as Record<string, unknown>)
      : {};
  const htmlContent = String(metadata.htmlContent ?? "");

  if (!htmlContent) {
    notFound();
  }

  redirect(`/satin-al/3d/raw?id=${paymentIntent.id}`);
}
