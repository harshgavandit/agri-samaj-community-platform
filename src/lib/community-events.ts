import type { PublicNewsSnapshot } from "./public-data";

export type CommunityUpdate = {
  id: string;
  titleMr: string;
  titleEn: string;
  bodyMr: string;
  bodyEn: string;
  date: string | null;
  changed: string;
  location: string | null;
  slug: string | null;
  calendar: boolean;
};
export function communityUpdates(
  snapshot: PublicNewsSnapshot,
): CommunityUpdate[] {
  return [
    ...snapshot.announcements.map((item) => ({
      id: `notice-${item.id}`,
      titleMr: item.titleMr,
      titleEn: item.titleEn,
      bodyMr: item.contentMr,
      bodyEn: item.contentEn,
      date: item.eventDate,
      changed: item.updatedAt,
      location: item.location,
      slug: null,
      calendar: false,
    })),
    ...snapshot.entries
      .filter((item) => ["EVENT", "NEWS", "INITIATIVE"].includes(item.kind))
      .map((item) => ({
        id: `article-${item.id}`,
        titleMr: item.titleMr,
        titleEn: item.titleEn,
        bodyMr: item.summaryMr,
        bodyEn: item.summaryEn,
        date: item.eventAt,
        changed: item.updatedAt,
        location: item.location,
        slug: item.slug,
        calendar: item.kind === "EVENT" && !!item.eventAt,
      })),
  ];
}
export function sortCommunityUpdates(
  items: CommunityUpdate[],
  period: string,
  query: string,
  now: number,
) {
  const term = query.trim().toLocaleLowerCase();
  return items
    .filter((item) => {
      const timestamp = item.date ? Date.parse(item.date) : null;
      return (
        (period === "all" ||
          (timestamp !== null &&
            (period === "upcoming" ? timestamp >= now : timestamp < now))) &&
        (!term ||
          [item.titleMr, item.titleEn, item.bodyMr, item.bodyEn, item.location]
            .join(" ")
            .toLocaleLowerCase()
            .includes(term))
      );
    })
    .sort((a, b) => {
      const aDate = Date.parse(a.date || a.changed),
        bDate = Date.parse(b.date || b.changed);
      if (period === "upcoming")
        return aDate - bDate || a.id.localeCompare(b.id);
      const aFuture = !!a.date && aDate >= now,
        bFuture = !!b.date && bDate >= now;
      if (period === "all" && aFuture !== bFuture) return aFuture ? -1 : 1;
      return (
        (aFuture && bFuture ? aDate - bDate : bDate - aDate) ||
        a.id.localeCompare(b.id)
      );
    });
}
