import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { getPrimaryBranchLocation } from "@/lib/locations/primary";

export async function GET() {
  const databaseAvailable = await isDatabaseAvailable();
  const location = await getPrimaryBranchLocation();

  return NextResponse.json({
    locations: [location],
    source: databaseAvailable ? "database" : "fallback",
  }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
