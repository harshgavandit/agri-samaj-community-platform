import { directoryQuery, parseDirectoryFilters } from "@/lib/directory-filters";
import {
  getPublicCategories,
  getPublicDirectoryFirstPage,
} from "@/lib/public-data";
import DirectoryClient from "./DirectoryContent";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
  }
  const filters = parseDirectoryFilters(params);
  const initialQuery = directoryQuery(filters).toString();
  const [categories, snapshot] = await Promise.all([
    getPublicCategories().catch(() => []),
    initialQuery
      ? Promise.resolve(null)
      : getPublicDirectoryFirstPage().catch(() => null),
  ]);
  const initialResult = snapshot
    ? {
        businesses: snapshot.businesses.slice(0, 12),
        pagination: {
          total: snapshot.total,
          totalPages: Math.ceil(snapshot.total / 12),
          page: 1,
          limit: 12,
        },
      }
    : null;
  return (
    <DirectoryClient
      initialCategories={categories}
      initialResult={initialResult}
      initialQuery={initialQuery}
    />
  );
}
