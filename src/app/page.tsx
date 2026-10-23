import HomePageContent from "@/components/HomePageContent";
import { getPublicHomeSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    return <HomePageContent initialData={await getPublicHomeSnapshot()} />;
  } catch {
    return (
      <HomePageContent initialError="The latest community information could not be loaded. Please try again." />
    );
  }
}
