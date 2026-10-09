import { createHmac, timingSafeEqual } from "node:crypto";
import Iyzipay from "iyzipay";

type IyzicoResult = Record<string, unknown>;

export function getIyzicoConfig() {
  const apiKey = process.env.IYZICO_API_KEY || process.env.IYZIPAY_API_KEY;
  const secretKey =
    process.env.IYZICO_SECRET_KEY || process.env.IYZIPAY_SECRET_KEY;
  const uri =
    process.env.IYZICO_BASE_URL ||
    process.env.IYZIPAY_URI ||
    "https://sandbox-api.iyzipay.com";

  return {
    apiKey,
    isConfigured: Boolean(apiKey && secretKey),
    secretKey,
    uri,
  };
}

export function getIyzicoClient() {
  const config = getIyzicoConfig();

  if (!config.apiKey || !config.secretKey) {
    throw new Error("Iyzico credentials are not configured.");
  }

  return new Iyzipay({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    uri: config.uri,
  });
}

export function priceString(value: number) {
  return value.toFixed(2);
}

export function initializeThreeDsPayment(request: Record<string, unknown>) {
  const iyzipay = getIyzicoClient();

  return new Promise<IyzicoResult>((resolve, reject) => {
    iyzipay.threedsInitialize.create(request, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export function completeThreeDsPayment(request: Record<string, unknown>) {
  const iyzipay = getIyzicoClient();

  return new Promise<IyzicoResult>((resolve, reject) => {
    iyzipay.threedsPayment.create(request, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export function completeThreeDsV2Payment(request: Record<string, unknown>) {
  const iyzipay = getIyzicoClient() as unknown as {
    threedsV2Payment: {
      create: (
        payload: Record<string, unknown>,
        callback: (error: unknown, result: IyzicoResult) => void,
      ) => void;
    };
  };

  return new Promise<IyzicoResult>((resolve, reject) => {
    iyzipay.threedsV2Payment.create(request, (error: unknown, result: IyzicoResult) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

export function verifyIyzicoResponseSignature(
  result: Record<string, unknown>,
  fields: string[],
) {
  const { secretKey } = getIyzicoConfig();
  const signature = String(result.signature ?? "");

  if (!secretKey || !signature) {
    return false;
  }

  const payload = fields
    .map((field) => signatureValue(field, result[field]))
    .join(":");
  const calculated = createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const calculatedBuffer = Buffer.from(calculated, "utf8");

  return (
    receivedBuffer.length === calculatedBuffer.length &&
    timingSafeEqual(receivedBuffer, calculatedBuffer)
  );
}

function signatureValue(field: string, value: unknown) {
  const text = String(value ?? "");

  if (!["price", "paidPrice"].includes(field) || !/^-?\d+(?:\.\d+)?$/.test(text)) {
    return text;
  }

  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}

export function decodeIyzicoHtml(htmlContent: unknown) {
  const value = String(htmlContent ?? "");

  if (!value) {
    return "";
  }

  if (value.trim().startsWith("<")) {
    return value;
  }

  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}
