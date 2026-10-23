import type { Metadata } from "next";
import NewsEventsContent from "@/components/NewsEventsContent";
import { getPublicUpdatesPage } from "@/lib/public-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "बातम्या व कार्यक्रम | News & Events | Aagri Samaj",
  description: "प्रकाशित समुदाय बातम्या, आगामी कार्यक्रम आणि मागील उपक्रम.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedFilter =
    typeof params.period === "string" ? params.period : "all";
  const initialFilter = ["all", "upcoming", "past"].includes(requestedFilter)
    ? (requestedFilter as "all" | "upcoming" | "past")
    : "all";
  const initialQuery =
    typeof params.q === "string" ? params.q.slice(0, 200).trim() : "";
  const requestedPage = Number(params.page || 1);
  const initialPage = Number.isInteger(requestedPage)
    ? Math.min(100000, Math.max(1, requestedPage))
    : 1;
  const initialNow = Date.now();
  try {
    const options = {
      q: initialQuery,
      period: initialFilter,
      page: initialPage,
      limit: 12,
    };
    const updates = await getPublicUpdatesPage(options);
    return (
      <NewsEventsContent
        initialData={updates}
        initialFilter={initialFilter}
        initialQuery={initialQuery}
        initialPage={initialPage}
        initialNow={initialNow}
      />
    );
  } catch {
    return (
      <NewsEventsContent
        initialError="The latest updates could not be loaded. Please try again."
        initialFilter={initialFilter}
        initialQuery={initialQuery}
        initialPage={initialPage}
        initialNow={initialNow}
      />
    );
  }
}
