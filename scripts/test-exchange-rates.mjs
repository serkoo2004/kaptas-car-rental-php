import assert from "node:assert/strict";
import {
  convertUsd,
  normalizeCurrency,
  usdConversionRate,
} from "../lib/exchange-rates.ts";

const snapshot = {
  asOf: "2026-08-15",
  provider: "test",
  rates: [
    { buying: 47.9, code: "USD", selling: 48 },
    { buying: 55.9, code: "EUR", selling: 56 },
  ],
};

assert.equal(normalizeCurrency("try"), "TRY");
assert.equal(normalizeCurrency("unsupported"), "TRY");
assert.equal(convertUsd(100, "USD"), 100);
assert.equal(convertUsd(100, "TRY", snapshot), 4800);
assert.equal(convertUsd(100, "EUR", snapshot), 85.71);
assert.equal(usdConversionRate("EUR", snapshot), 0.86);
assert.throws(() => convertUsd(-1, "USD"), /Geçersiz USD tutarı/);

console.log("USD tabanlı TRY, USD ve EUR dönüşüm testleri başarılı.");
