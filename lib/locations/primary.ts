import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";

const fallbackPrimaryLocation = {
  address: "Merkez lokasyon, teslim ve iade operasyon noktasi",
  email: "info@arackiralama.local",
  id: "fallback-merkez",
  image: "/images/fleet-hero.png",
  name: "Merkez Ofis",
  phone: "0",
  rating: "5,0",
  subtitle: "Rezervasyon ve teslim koordinasyon merkezi",
  type: "city",
};

export async function getPrimaryBranchLocation() {
  if (await isDatabaseAvailable()) {
    const location = await prisma.branchLocation.findFirst({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      where: { isActive: true },
    });

    if (location) {
      return {
        address: location.address,
        email: location.email ?? fallbackPrimaryLocation.email,
        id: location.id,
        image: location.imageUrl ?? fallbackPrimaryLocation.image,
        name: location.name,
        phone: location.phone ?? fallbackPrimaryLocation.phone,
        rating: location.rating
          ? Number(location.rating).toLocaleString("tr-TR", {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            })
          : fallbackPrimaryLocation.rating,
        subtitle: location.subtitle ?? "",
        type: location.type,
      };
    }
  }

  return fallbackPrimaryLocation;
}

export async function getPrimaryLocationName() {
  return (await getPrimaryBranchLocation()).name;
}
