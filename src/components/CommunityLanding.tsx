import CommunityHub from "./CommunityHub";
import { getPublicContentPage } from "@/lib/public-data";
import type { ContentKind } from "@/lib/community";

const sectionKinds: Record<string, readonly ContentKind[]> = {
  about: ["ABOUT", "ORGANIZATION", "ACHIEVEMENT"],
  culture: ["CULTURE"],
  resources: ["EDUCATION", "RESOURCE", "ORGANIZATION"],
  initiatives: ["INITIATIVE", "ORGANIZATION", "ACHIEVEMENT"],
};

export default async function CommunityLanding({
  section,
  searchParams,
}: {
  section: "about" | "culture" | "resources" | "initiatives";
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialQuery =
    typeof params?.q === "string" ? params.q.slice(0, 200).trim() : "";
  const requestedKind = typeof params?.kind === "string" ? params.kind : "";
  const initialKind = sectionKinds[section].includes(
    requestedKind as ContentKind,
  )
    ? requestedKind
    : "";
  const requestedPage = Number(params?.page || 1);
  const initialPage = Number.isInteger(requestedPage)
    ? Math.min(100000, Math.max(1, requestedPage))
    : 1;
  try {
    return (
      <CommunityHub
        section={section}
        initialData={await getPublicContentPage({
          kinds: initialKind
            ? [initialKind as ContentKind]
            : sectionKinds[section],
          q: initialQuery,
          page: initialPage,
          limit: 12,
        })}
        initialQuery={initialQuery}
        initialKind={initialKind}
        initialPage={initialPage}
      />
    );
  } catch {
    return (
      <CommunityHub
        section={section}
        initialError="Community information could not be loaded. Please try again."
        initialQuery={initialQuery}
        initialKind={initialKind}
        initialPage={initialPage}
      />
    );
  }
}
