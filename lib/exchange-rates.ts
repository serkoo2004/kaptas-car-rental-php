import { XMLParser } from "fast-xml-parser";

export const supportedCurrencies = ["TRY", "USD", "EUR"] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];

export type ExchangeRate = {
  buying: number;
  code: "EUR" | "USD";
  selling: number;
};

export type ExchangeRateSnapshot = {
  asOf: string;
  provider: string;
  rates: ExchangeRate[];
  stale?: boolean;
};

type TcmbCurrency = {
  "@_CurrencyCode"?: string;
  ForexBuying?: string | number;
  ForexSelling?: string | number;
};

let cachedSnapshot:
  | { fetchedAt: number; snapshot: ExchangeRateSnapshot }
  | undefined;

const freshCacheMs = 30 * 60 * 1000;
const staleCacheMs = 24 * 60 * 60 * 1000;

export function normalizeCurrency(value: unknown): SupportedCurrency {
  const currency = String(value ?? "").toUpperCase();
  return supportedCurrencies.includes(currency as SupportedCurrency)
    ? (currency as SupportedCurrency)
    : "TRY";
}

export async function getExchangeRateSnapshot(): Promise<ExchangeRateSnapshot> {
  const now = Date.now();

  if (cachedSnapshot && now - cachedSnapshot.fetchedAt < freshCacheMs) {
    return cachedSnapshot.snapshot;
  }

  try {
    const snapshot = await getTcmbRates();
    cachedSnapshot = { fetchedAt: now, snapshot };
    return snapshot;
  } catch {
    try {
      const snapshot = await getReferenceRates();
      cachedSnapshot = { fetchedAt: now, snapshot };
      return snapshot;
    } catch {
      if (cachedSnapshot && now - cachedSnapshot.fetchedAt < staleCacheMs) {
        return { ...cachedSnapshot.snapshot, stale: true };
      }

      throw new Error("Döviz kuru servisine ulaşılamadı.");
    }
  }
}

export function convertUsd(
  usdAmount: number,
  currency: SupportedCurrency,
  snapshot?: ExchangeRateSnapshot,
) {
  if (!Number.isFinite(usdAmount) || usdAmount < 0) {
    throw new Error("Geçersiz USD tutarı.");
  }

  if (currency === "USD") {
    return roundMoney(usdAmount);
  }

  if (!snapshot) {
    throw new Error("Kur bilgisi gereklidir.");
  }

  const usdTry = rate(snapshot, "USD").selling;
  const converted =
    currency === "TRY"
      ? usdAmount * usdTry
      : (usdAmount * usdTry) / rate(snapshot, "EUR").selling;

  return roundMoney(converted);
}

export function usdConversionRate(
  currency: SupportedCurrency,
  snapshot?: ExchangeRateSnapshot,
) {
  return convertUsd(1, currency, snapshot);
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale = "tr-TR",
) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: currency === "TRY" ? 0 : 2,
    minimumFractionDigits: currency === "TRY" ? 0 : 2,
    style: "currency",
  }).format(amount);
}

async function getTcmbRates(): Promise<ExchangeRateSnapshot> {
  const upstream = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
    headers: { Accept: "application/xml, text/xml" },
    next: { revalidate: 1800 },
  });

  if (!upstream.ok) throw new Error("TCMB response failed");

  const document = new XMLParser({ ignoreAttributes: false }).parse(
    await upstream.text(),
  );
  const root = document?.Tarih_Date;
  const currencies: TcmbCurrency[] = Array.isArray(root?.Currency)
    ? root.Currency
    : [root?.Currency].filter(Boolean);
  const rates = ["USD", "EUR"].map((code) => {
    const currency = currencies.find(
      (item) => item?.["@_CurrencyCode"] === code,
    );
    const buying = Number(currency?.ForexBuying);
    const selling = Number(currency?.ForexSelling);

    if (!Number.isFinite(buying) || !Number.isFinite(selling)) {
      throw new Error(`Missing ${code} rate`);
    }

    return { buying, code, selling } as ExchangeRate;
  });

  return {
    asOf: root?.["@_Date"] ?? new Date().toISOString().slice(0, 10),
    provider: "TCMB",
    rates,
  };
}

async function getReferenceRates(): Promise<ExchangeRateSnapshot> {
  const upstream = await fetch(
    "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=TRY,USD",
    { headers: { Accept: "application/json" }, next: { revalidate: 1800 } },
  );

  if (!upstream.ok) throw new Error("Reference rate response failed");
  const payload = await upstream.json();
  const eurTry = Number(payload?.rates?.TRY);
  const eurUsd = Number(payload?.rates?.USD);
  const usdTry = eurTry / eurUsd;

  if (![eurTry, eurUsd, usdTry].every(Number.isFinite)) {
    throw new Error("Invalid reference rates");
  }

  return {
    asOf: payload.date,
    provider: "Frankfurter",
    rates: [
      { buying: usdTry, code: "USD", selling: usdTry },
      { buying: eurTry, code: "EUR", selling: eurTry },
    ],
  };
}

function rate(snapshot: ExchangeRateSnapshot, code: "EUR" | "USD") {
  const result = snapshot.rates.find((item) => item.code === code);

  if (!result || !Number.isFinite(result.selling) || result.selling <= 0) {
    throw new Error(`${code} kuru bulunamadı.`);
  }

  return result;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
