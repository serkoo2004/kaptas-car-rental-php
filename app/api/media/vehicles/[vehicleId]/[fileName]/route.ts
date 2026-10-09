import { NextResponse } from "next/server";
import { readStoredVehicleImage } from "@/lib/uploads/vehicle-images";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string; vehicleId: string }> },
) {
  const { fileName, vehicleId } = await params;

  try {
    const image = await readStoredVehicleImage(vehicleId, fileName);

    return new NextResponse(image.body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": image.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 404 });
  }
}
