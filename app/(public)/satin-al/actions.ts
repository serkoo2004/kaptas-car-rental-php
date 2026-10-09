"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { getPrimaryLocationName } from "@/lib/locations/primary";
import {
  decodeIyzicoHtml,
  getIyzicoConfig,
  initializeThreeDsPayment,
  priceString,
  verifyIyzicoResponseSignature,
} from "@/lib/payments/iyzico";
import { calculateRentalCharge } from "@/lib/payments/pricing";
import {
  convertUsd,
  getExchangeRateSnapshot,
  normalizeCurrency,
  type ExchangeRateSnapshot,
  usdConversionRate,
} from "@/lib/exchange-rates";
import {
  attachPaymentAndExtendHold,
  cancelReservationForPayment,
  createReservationHold,
  parseRentalPeriod,
  RentalPeriodError,
  ReservationUnavailableError,
} from "@/lib/reservations/availability";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { name: parts[0] || "Musteri", surname: "Kiralama" };
  }

  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

function isValidCardNumber(value: string) {
  if (!/^\d{13,19}$/.test(value)) {
    return false;
  }

  let sum = 0;
  let doubleDigit = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function isValidExpiry(month: string, year: string) {
  const numericMonth = Number(month);
  const numericYear = Number(year.length === 2 ? `20${year}` : year);

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    !Number.isInteger(numericYear)
  ) {
    return false;
  }

  const expiry = new Date(Date.UTC(numericYear, numericMonth, 1));
  return expiry > new Date();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) return `+90${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+9${digits}`;
  if (digits.length === 12 && digits.startsWith("90")) return `+${digits}`;

  return value.replace(/[\s()-]/g, "");
}

function clientIpFromHeaders(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || requestHeaders.get("x-real-ip")?.trim();

  return candidate && /^[0-9a-f:.]+$/i.test(candidate) ? candidate : "127.0.0.1";
}

export async function startVehiclePurchase(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/satin-al?error=database");
  }

  const vehicleId = text(formData, "vehicleId");
  const leadId = text(formData, "leadId");
  const customerName = text(formData, "customerName");
  const customerPhone = normalizePhone(text(formData, "customerPhone"));
  const customerEmail = text(formData, "customerEmail");
  const identityNumber = text(formData, "identityNumber");
  const city = text(formData, "city");
  const district = text(formData, "district");
  const address = text(formData, "address");
  const primaryLocation = await getPrimaryLocationName();
  const pickupLocation = primaryLocation;
  const dropoffLocation = primaryLocation;
  const pickupDate = text(formData, "pickupDate");
  const pickupTime = text(formData, "pickupTime");
  const dropoffDate = text(formData, "dropoffDate");
  const dropoffTime = text(formData, "dropoffTime");
  const pickupNote = text(formData, "pickupNote");
  const cardHolderName = text(formData, "cardHolderName");
  const cardNumber = text(formData, "cardNumber").replace(/\s+/g, "");
  const expireMonth = text(formData, "expireMonth").padStart(2, "0");
  const expireYear = text(formData, "expireYear");
  const cvc = text(formData, "cvc");
  const currency = normalizeCurrency(text(formData, "currency"));

  if (
    !vehicleId ||
    !customerName ||
    !customerPhone ||
    !customerEmail ||
    !identityNumber ||
    !city ||
    !address ||
    !pickupDate ||
    !pickupTime ||
    !dropoffDate ||
    !dropoffTime ||
    !cardHolderName ||
    !cardNumber ||
    !expireMonth ||
    !expireYear ||
    !cvc ||
    !/^\S+@\S+\.\S+$/.test(customerEmail) ||
    !/^\d{11}$/.test(identityNumber) ||
    !/^\+?[1-9]\d{9,14}$/.test(customerPhone) ||
    !isValidCardNumber(cardNumber) ||
    !/^\d{3,4}$/.test(cvc) ||
    !isValidExpiry(expireMonth, expireYear)
  ) {
    redirect(`/satin-al?vehicleId=${vehicleId}&currency=${currency}&error=validation`);
  }

  let rentalPeriod;

  try {
    rentalPeriod = parseRentalPeriod({
      dropoffDate,
      dropoffTime,
      pickupDate,
      pickupTime,
    });
  } catch (error) {
    const code = error instanceof RentalPeriodError ? "period" : "validation";
    redirect(`/satin-al?vehicleId=${vehicleId}&leadId=${leadId}&currency=${currency}&error=${code}`);
  }

  const config = getIyzicoConfig();

  if (!config.isConfigured) {
    redirect(`/satin-al?vehicleId=${vehicleId}&leadId=${leadId}&currency=${currency}&error=iyzico-config`);
  }

  const vehicle = await prisma.vehicle.findFirst({
    include: {
      brand: true,
      model: true,
      packages: {
        orderBy: [{ monthlyPrice: "asc" }],
        where: { isActive: true },
      },
    },
    where: {
      id: vehicleId,
      isPublishedWeb: true,
      status: "PUBLISHED",
      stockCount: { gt: 0 },
    },
  });

  if (!vehicle) {
    redirect("/satin-al?error=not-found");
  }

  const baseDailyPriceUsd = Number(vehicle.dailyPrice ?? 0);

  if (!Number.isFinite(baseDailyPriceUsd) || baseDailyPriceUsd <= 0) {
    redirect(`/satin-al?vehicleId=${vehicle.id}&currency=${currency}&error=no-price`);
  }

  let exchangeSnapshot: ExchangeRateSnapshot | undefined;
  let dailyPrice = baseDailyPriceUsd;

  try {
    exchangeSnapshot = currency === "USD" ? undefined : await getExchangeRateSnapshot();
    dailyPrice = convertUsd(baseDailyPriceUsd, currency, exchangeSnapshot);
  } catch {
    redirect(`/satin-al?vehicleId=${vehicle.id}&leadId=${leadId}&currency=${currency}&error=rate`);
  }

  const charge = calculateRentalCharge(
    dailyPrice,
    rentalPeriod.pickupAt,
    rentalPeriod.dropoffAt,
  );
  const amount = priceString(charge.total);
  const appUrl = (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const requestHeaders = await headers();
  const session = await getCurrentSession();
  const userId =
    session?.user?.status === "ACTIVE" ? session.user.id ?? null : null;
  const clientIp = clientIpFromHeaders(requestHeaders);
  const quoteRequest = leadId
    ? await prisma.quoteRequest.findUnique({ where: { id: leadId } })
    : null;
  const existingReservation = quoteRequest
    ? await prisma.reservation.findUnique({
        where: { quoteRequestId: quoteRequest.id },
      })
    : null;
  const baseMetadata = {
    address,
    city,
    billableDays: charge.billableDays,
    customerEmail,
    customerName,
    customerPhone,
    district,
    dropoffDate,
    dropoffLocation,
    dropoffTime,
    leadId: quoteRequest?.id ?? null,
    pickupDate,
    pickupLocation,
    pickupNote,
    pickupTime,
    dailyRate: charge.dailyRate,
    baseDailyPriceUsd,
    currency,
    exchangeRate: usdConversionRate(currency, exchangeSnapshot),
    exchangeRateAsOf: exchangeSnapshot?.asOf ?? null,
    exchangeRateProvider: exchangeSnapshot?.provider ?? "USD base",
    totalAmount: charge.total,
    vehicleId: vehicle.id,
    vehicleTitle: vehicle.title,
  };
  const paymentIntent = await prisma.paymentIntent.create({
    data: {
      amount,
      currency,
      metadata: baseMetadata,
      provider: "iyzico",
      quoteRequestId: quoteRequest?.id ?? null,
      status: "PENDING",
      userId,
    },
  });

  try {
    if (existingReservation) {
      await attachPaymentAndExtendHold({
        customerEmail,
        customerName,
        customerPhone,
        dropoffAt: rentalPeriod.dropoffAt,
        dropoffLocation,
        paymentIntentId: paymentIntent.id,
        pickupAt: rentalPeriod.pickupAt,
        pickupLocation,
        reservationId: existingReservation.id,
        userId,
        vehicleId: vehicle.id,
      });
    } else {
      await createReservationHold({
        customerEmail,
        customerName,
        customerPhone,
        dropoffAt: rentalPeriod.dropoffAt,
        dropoffLocation,
        paymentIntentId: paymentIntent.id,
        pickupAt: rentalPeriod.pickupAt,
        pickupLocation,
        quoteRequestId: quoteRequest?.id ?? null,
        userId,
        vehicleId: vehicle.id,
      });
    }
  } catch (error) {
    await prisma.paymentIntent.update({
      data: { status: "CANCELLED" },
      where: { id: paymentIntent.id },
    });

    if (error instanceof ReservationUnavailableError) {
      redirect(
        `/satin-al?vehicleId=${vehicle.id}&leadId=${leadId}&currency=${currency}&error=unavailable`,
      );
    }

    redirect(`/satin-al?vehicleId=${vehicle.id}&leadId=${leadId}&currency=${currency}&error=reservation`);
  }

  const buyerName = splitName(customerName);
  const paymentRequest = {
    basketId: paymentIntent.id,
    basketItems: [
      {
        category1: "Arac Kiralama",
        id: vehicle.id,
        itemType: "PHYSICAL",
        name: `${vehicle.title} - ${charge.billableDays} günlük kiralama`,
        price: amount,
      },
    ],
    billingAddress: {
      address,
      city,
      contactName: customerName,
      country: "Turkey",
      zipCode: "61000",
    },
    buyer: {
      city,
      country: "Turkey",
      email: customerEmail,
      gsmNumber: customerPhone,
      id: paymentIntent.id,
      identityNumber,
      ip: clientIp,
      name: buyerName.name,
      registrationAddress: [address, district].filter(Boolean).join(" / "),
      surname: buyerName.surname,
      zipCode: "61000",
    },
    callbackUrl: `${appUrl}/api/payments/iyzico/3ds-callback`,
    conversationId: paymentIntent.id,
    currency,
    enabledInstallments: currency === "TRY" ? [1, 2, 3, 6] : [1],
    installment: "1",
    locale: "tr",
    paidPrice: amount,
    paymentCard: {
      cardHolderName,
      cardNumber,
      cvc,
      expireMonth,
      expireYear,
      registerCard: "0",
    },
    paymentChannel: "WEB",
    paymentGroup: "PRODUCT",
    price: amount,
    shippingAddress: {
      address,
      city,
      contactName: customerName,
      country: "Turkey",
      zipCode: "61000",
    },
  };

  const result = await initializeThreeDsPayment(paymentRequest).catch(
    async () => {
      await prisma.paymentIntent.update({
        data: { status: "FAILED" },
        where: { id: paymentIntent.id },
      });
      await cancelReservationForPayment(
        paymentIntent.id,
        "Iyzico 3D Secure başlatılamadı.",
      );
      return null;
    },
  );

  if (!result) {
    redirect(`/satin-al?vehicleId=${vehicle.id}&leadId=${leadId}&currency=${currency}&error=iyzico`);
  }

  const status = String(result.status ?? "");
  const paymentId = String(result.paymentId ?? "");
  const threeDsHtml = decodeIyzicoHtml(
    result.threeDSHtmlContent ?? result.htmlContent,
  );
  const initSignatureValid = verifyIyzicoResponseSignature(result, [
    "paymentId",
    "conversationId",
  ]);
  const initConversationId = String(result.conversationId ?? "");
  const initializationValid =
    status === "success" &&
    Boolean(paymentId) &&
    Boolean(threeDsHtml) &&
    initSignatureValid &&
    initConversationId === paymentIntent.id;

  await prisma.paymentIntent.update({
    data: {
      metadata: {
        ...baseMetadata,
        htmlContent: threeDsHtml,
        iyzicoPaymentId: paymentId,
        iyzicoSignatureVerified: initSignatureValid,
        iyzicoStatus: status,
      },
      providerRef: paymentId || null,
      status: initializationValid ? "PENDING" : "FAILED",
    },
    where: { id: paymentIntent.id },
  });

  if (!initializationValid) {
    await cancelReservationForPayment(
      paymentIntent.id,
      "Iyzico 3D Secure ekranı oluşturulamadı.",
    );
    redirect(`/satin-al?vehicleId=${vehicle.id}&currency=${currency}&error=iyzico`);
  }

  redirect(`/satin-al/3d?id=${paymentIntent.id}`);
}
