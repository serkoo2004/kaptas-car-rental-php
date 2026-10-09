import { NextResponse } from "next/server";
import { getExchangeRateSnapshot } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getExchangeRateSnapshot(), {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Döviz kuru servisine ulaşılamadı." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
