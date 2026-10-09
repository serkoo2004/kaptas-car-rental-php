import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || !(await isDatabaseAvailable())) {
    return new Response("3D Secure kaydı bulunamadı.", { status: 404 });
  }

  const paymentIntent = await prisma.paymentIntent.findUnique({
    where: { id },
  });

  const metadata =
    paymentIntent?.metadata &&
    typeof paymentIntent.metadata === "object" &&
    !Array.isArray(paymentIntent.metadata)
      ? (paymentIntent.metadata as Record<string, unknown>)
      : {};
  const htmlContent = String(metadata.htmlContent ?? "");

  if (
    !paymentIntent ||
    paymentIntent.provider !== "iyzico" ||
    paymentIntent.status !== "PENDING" ||
    !htmlContent
  ) {
    return new Response("3D Secure içeriği bulunamadı.", { status: 404 });
  }

  return new Response(htmlContent, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}
