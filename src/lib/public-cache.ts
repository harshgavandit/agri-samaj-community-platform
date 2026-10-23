import { revalidateTag } from "next/cache";
import { publicDataTags } from "./public-data";

// Invalidate only after the database transaction commits. TTL is a second bound
// on freshness if a server process stops between committing and invalidating.
export function invalidatePublicData(
  ...areas: (keyof typeof publicDataTags)[]
) {
  for (const area of areas) revalidateTag(publicDataTags[area]);
}
