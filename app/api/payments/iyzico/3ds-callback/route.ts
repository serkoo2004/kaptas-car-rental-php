import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  completeThreeDsV2Payment,
  priceString,
  verifyIyzicoResponseSignature,
} from "@/lib/payments/iyzico";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const conversationId = String(formData.get("conversationId") ?? "");
  const paymentId = String(formData.get("paymentId") ?? "");
  const conversationData = String(formData.get("conversationData") ?? "");
  const mdStatus = String(formData.get("mdStatus") ?? "");
  const callbackStatus = String(formData.get("status") ?? "");
  const callbackSignature = String(formData.get("signature") ?? "");
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin;

  if (!conversationId || !paymentId) {
    return NextResponse.redirect(`${appUrl}/satin-al/sonuc?status=failed`);
  }

  const callbackSignatureValid = verifyIyzicoResponseSignature(
    {
      conversationData,
      conversationId,
      mdStatus,
      paymentId,
      signature: callbackSignature,
      status: callbackStatus,
    },
    ["conversationData", "conversationId", "mdStatus", "paymentId", "status"],
  );

  if (!callbackSignatureValid) {
    return NextResponse.redirect(`${appUrl}/satin-al/sonuc?status=failed`);
  }

  const paymentIntent = await prisma.paymentIntent.findUnique({
    where: { id: conversationId },
  });

  if (!paymentIntent) {
    return NextResponse.redirect(`${appUrl}/satin-al/sonuc?status=unknown`);
  }

  if (paymentIntent.status === "PAID" && paymentIntent.provider === "iyzico") {
    return NextResponse.redirect(
      appUrl + "/satin-al/sonuc?id=" + paymentIntent.id,
    );
  }

  if (
    paymentIntent.provider !== "iyzico" ||
    paymentIntent.status !== "PENDING" ||
    (paymentIntent.providerRef && paymentIntent.providerRef !== paymentId)
  ) {
    return NextResponse.redirect(
      appUrl + "/satin-al/sonuc?id=" + paymentIntent.id,
    );
  }

  const claimed = await prisma.paymentIntent.updateMany({
    data: { status: "AUTHORIZED" },
    where: { id: paymentIntent.id, status: "PENDING" },
  });

  if (claimed.count !== 1) {
    return NextResponse.redirect(
      appUrl + "/satin-al/sonuc?id=" + paymentIntent.id,
    );
  }

  const result =
    mdStatus === "1" && callbackStatus === "success"
      ? await completeThreeDsV2Payment({
          basketId: paymentIntent.id,
          conversationId,
          currency: paymentIntent.currency,
          locale: "tr",
          paidPrice: priceString(Number(paymentIntent.amount)),
          paymentId,
        }).catch((error) => ({
          errorMessage:
            error instanceof Error ? error.message : "3D payment failed",
          status: "failure",
        }))
      : {
          errorMessage: `3D Secure dogrulamasi basarisiz. mdStatus=${mdStatus}`,
          mdStatus,
          status: "failure",
        };

  const safeResult = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
  const existingMetadata =
    paymentIntent.metadata &&
    typeof paymentIntent.metadata === "object" &&
    !Array.isArray(paymentIntent.metadata)
      ? (paymentIntent.metadata as Record<string, unknown>)
      : {};
  const metadataWithoutHtml = { ...existingMetadata };
  delete metadataWithoutHtml.htmlContent;
  const resultPaymentId = String(safeResult.paymentId ?? "");
  const resultConversationId = String(safeResult.conversationId ?? "");
  const resultCurrency = String(safeResult.currency ?? "");
  const resultBasketId = String(safeResult.basketId ?? "");
  const resultPrice = Number(safeResult.price ?? 0);
  const resultPaidPrice = Number(safeResult.paidPrice ?? 0);
  const fraudStatus = Number(safeResult.fraudStatus ?? 0);
  const expectedAmount = Number(paymentIntent.amount);
  const signatureVerified = verifyIyzicoResponseSignature(safeResult, [
    "paymentId",
    "currency",
    "basketId",
    "conversationId",
    "paidPrice",
    "price",
  ]);
  const isPaid =
    String(safeResult.status ?? "") === "success" &&
    signatureVerified &&
    resultPaymentId === paymentId &&
    resultConversationId === paymentIntent.id &&
    resultBasketId === paymentIntent.id &&
    resultCurrency === paymentIntent.currency &&
    Number.isFinite(resultPrice) &&
    Math.abs(resultPrice - expectedAmount) < 0.01 &&
    Number.isFinite(resultPaidPrice) &&
    Math.abs(resultPaidPrice - expectedAmount) < 0.01 &&
    fraudStatus === 1;

  let requiresReview = false;

  await prisma.$transaction(async (transaction) => {
    const reservation = await transaction.reservation.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    });
    let canConfirmReservation = false;

    if (isPaid && reservation) {
      const lockedVehicle = await transaction.$queryRaw<
        Array<{ id: string; stockCount: number }>
      >`SELECT id, stockCount FROM Vehicle WHERE id = ${reservation.vehicleId} FOR UPDATE`;

      if (lockedVehicle[0]?.stockCount > 0) {
        await transaction.reservation.updateMany({
          data: { status: "EXPIRED" },
          where: {
            holdExpiresAt: { lte: new Date() },
            id: { not: reservation.id },
            status: "HOLD",
            vehicleId: reservation.vehicleId,
          },
        });

        const overlapCount = await transaction.reservation.count({
          where: {
            dropoffAt: { gt: reservation.pickupAt },
            id: { not: reservation.id },
            pickupAt: { lt: reservation.dropoffAt },
            vehicleId: reservation.vehicleId,
            OR: [
              { status: "CONFIRMED" },
              { holdExpiresAt: { gt: new Date() }, status: "HOLD" },
            ],
          },
        });

        canConfirmReservation = overlapCount < lockedVehicle[0].stockCount;
      }
    }

    requiresReview = isPaid && !canConfirmReservation;

    await transaction.paymentIntent.update({
      data: {
        metadata: {
          ...metadataWithoutHtml,
          iyzicoThreeDsCallback: {
            conversationData,
            callbackStatus,
            callbackSignatureValid,
            mdStatus,
            paymentId,
            result: safeResult,
            signatureVerified,
            verifiedAt: isPaid ? new Date().toISOString() : null,
          },
        } as Prisma.InputJsonObject,
        providerRef: isPaid ? resultPaymentId : paymentIntent.providerRef,
        status: isPaid
          ? canConfirmReservation
            ? "PAID"
            : "REVIEW_REQUIRED"
          : "FAILED",
      },
      where: { id: paymentIntent.id },
    });

    await transaction.reservation.updateMany({
      data: isPaid && canConfirmReservation
        ? {
            cancellationNote: null,
            holdExpiresAt: null,
            status: "CONFIRMED",
          }
        : {
            cancellationNote: isPaid
              ? "Ödeme alındı ancak araç kapasitesi yeniden kontrol edilmelidir."
              : "3D Secure ödeme doğrulanamadı.",
            holdExpiresAt: null,
            status: "CANCELLED",
          },
      where: {
        paymentIntentId: paymentIntent.id,
        status: { in: ["HOLD", "EXPIRED"] },
      },
    });

    if (isPaid && canConfirmReservation && paymentIntent.quoteRequestId) {
      const quote = await transaction.quoteRequest.findUnique({
        select: { status: true },
        where: { id: paymentIntent.quoteRequestId },
      });

      if (quote && quote.status !== "APPROVED") {
        await transaction.quoteRequest.update({
          data: { status: "APPROVED" },
          where: { id: paymentIntent.quoteRequestId },
        });
        await transaction.quoteStatusHistory.create({
          data: {
            fromStatus: quote.status,
            note: "Iyzico 3D Secure ödeme doğrulandı. Ödeme: " + paymentId,
            quoteRequestId: paymentIntent.quoteRequestId,
            toStatus: "APPROVED",
          },
        });
      }
    }
  }).catch(async () => {
    if (isPaid) {
      requiresReview = true;
      await prisma.paymentIntent.updateMany({
        data: { status: "REVIEW_REQUIRED" },
        where: { id: paymentIntent.id, status: "AUTHORIZED" },
      });
      return;
    }

    await prisma.paymentIntent.updateMany({
      data: { status: "FAILED" },
      where: { id: paymentIntent.id, status: "AUTHORIZED" },
    });
  });

  return NextResponse.redirect(
    `${appUrl}/satin-al/sonuc?status=${
      requiresReview ? "review" : isPaid ? "paid" : "failed"
    }&id=${paymentIntent.id}`,
  );
}
