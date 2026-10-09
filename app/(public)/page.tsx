import VehiclesPage from "@/app/(public)/araclar/page";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage(props: HomePageProps) {
  return VehiclesPage(props);
}
