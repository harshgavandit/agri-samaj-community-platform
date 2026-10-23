import { unstable_cache } from "next/cache";
import { createHash } from "node:crypto";
import { prisma } from "./prisma";
import { publicBusiness, publicBusinessSelect } from "./business";
import { contentKinds, defaultSettings, type ContentKind } from "./community";
import { publicContent } from "./community-validation";
import { Prisma } from "@prisma/client";
import { HttpError } from "./http";
import { readPagination } from "./pagination";

// Local QA uses isolated schemas. Never reuse persisted Next cache entries
// across a changed database/schema, and never put connection credentials in keys.
const databaseCacheIdentity = createHash("sha256")
  .update(process.env.DATABASE_URL || "unconfigured")
  .digest("hex")
  .slice(0, 20);

export const publicDataTags = {
  community: "public-community-v1",
  businesses: "public-businesses-v1",
  categories: "public-categories-v1",
  announcements: "public-announcements-v1",
  publications: "public-publications-v1",
  packages: "public-packages-v1",
} as const;

// Only public summary columns belong in this shared cache. Editorial notes,
// reviewer identities and full article bodies are intentionally excluded.
export const communitySummarySelect = {
  id: true,
  slug: true,
  kind: true,
  titleMr: true,
  titleEn: true,
  summaryMr: true,
  summaryEn: true,
  sources: true,
  sourceNoteMr: true,
  sourceNoteEn: true,
  period: true,
  featured: true,
  coverImageUrl: true,
  coverCredit: true,
  actionUrl: true,
  eventAt: true,
  location: true,
  verifiedAt: true,
  updatedAt: true,
} as const;

export const getPublicSiteSettings = unstable_cache(
  async () => {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "public" },
    });
    return settings
      ? { ...settings, updatedAt: settings.updatedAt.toISOString() }
      : defaultSettings;
  },
  ["public-settings-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.community] },
);

export const getPublicCommunitySnapshot = unstable_cache(
  async () => {
    const [entries, settings] = await Promise.all([
      prisma.communityContent.findMany({
        where: { status: "PUBLISHED", sourceVerified: true },
        select: communitySummarySelect,
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
        take: 100,
      }),
      getPublicSiteSettings(),
    ]);
    return {
      entries: entries.map((entry) => publicContent(entry, false)),
      settings,
    };
  },
  ["public-community-snapshot-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.community] },
);

export const getPublicCategories = unstable_cache(
  async () =>
    (
      await prisma.businessCategory.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: {
          _count: { select: { businesses: { where: { status: "APPROVED" } } } },
        },
      })
    ).map((category) => ({
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    })),
  ["public-categories-v1", databaseCacheIdentity],
  {
    revalidate: 60,
    tags: [publicDataTags.categories, publicDataTags.businesses],
  },
);

export const getPublicDirectoryFirstPage = unstable_cache(
  async () => {
    const [businesses, total] = await Promise.all([
      prisma.businessProfile.findMany({
        where: { status: "APPROVED" },
        select: publicBusinessSelect,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 50,
      }),
      prisma.businessProfile.count({ where: { status: "APPROVED" } }),
    ]);
    return { businesses: businesses.map(publicBusiness), total };
  },
  ["public-directory-first-page-v1", databaseCacheIdentity],
  {
    revalidate: 60,
    tags: [publicDataTags.businesses, publicDataTags.categories],
  },
);

export async function getPublicHomeBusinesses() {
  return (await getPublicDirectoryFirstPage()).businesses.slice(0, 3);
}

// Keep the public grounding corpus small even when an article has a long body.
// Both language excerpts fit in one shared cache entry and expire with content
// publication changes. Private editorial fields are never selected.
export const getPublicAssistantCorpus = unstable_cache(
  async () =>
    (
      await prisma.communityContent.findMany({
        where: { status: "PUBLISHED", sourceVerified: true },
        select: {
          slug: true,
          titleMr: true,
          titleEn: true,
          summaryMr: true,
          summaryEn: true,
          bodyMr: true,
          bodyEn: true,
          sourceNoteMr: true,
          sourceNoteEn: true,
          eventAt: true,
          location: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      })
    ).map((entry) => ({
      ...entry,
      bodyMr: entry.bodyMr.slice(0, 1800),
      bodyEn: entry.bodyEn.slice(0, 1800),
      eventAt: entry.eventAt?.toISOString() || null,
    })),
  ["public-assistant-corpus-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.community] },
);

export const getPublicAnnouncements = unstable_cache(
  async () =>
    (
      await prisma.announcement.findMany({
        where: { isPublished: true },
        orderBy: [{ eventDate: "desc" }, { id: "asc" }],
        take: 6,
      })
    ).map((announcement) => ({
      ...announcement,
      eventDate: announcement.eventDate?.toISOString() || null,
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    })),
  ["public-announcements-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.announcements] },
);

export const getPublicPackages = unstable_cache(
  async () =>
    prisma.advertisementPackage.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
  ["public-packages-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.packages] },
);

export const getPublicPublications = unstable_cache(
  async () =>
    prisma.publication.findMany({
      where: { isPublic: true },
      orderBy: [{ editionYear: "desc" }, { id: "asc" }],
    }),
  ["public-publications-v1", databaseCacheIdentity],
  { revalidate: 60, tags: [publicDataTags.publications] },
);

// Called by dynamic page wrappers, never at module initialization or build time.
export async function getPublicHomeSnapshot() {
  const [community, businesses, categories, announcements] = await Promise.all([
    getPublicCommunitySnapshot(),
    getPublicHomeBusinesses(),
    getPublicCategories(),
    getPublicAnnouncements(),
  ]);
  return { ...community, businesses, categories, announcements };
}

export async function getPublicNewsSnapshot() {
  const [community, announcements] = await Promise.all([
    getPublicCommunitySnapshot(),
    getPublicAnnouncements(),
  ]);
  return { entries: community.entries, announcements };
}

export type PublicHomeSnapshot = Awaited<
  ReturnType<typeof getPublicHomeSnapshot>
>;
export type PublicCommunitySnapshot = Awaited<
  ReturnType<typeof getPublicCommunitySnapshot>
>;
export type PublicNewsSnapshot = Awaited<
  ReturnType<typeof getPublicNewsSnapshot>
>;

type PublicPageOptions = {
  q?: string;
  page?: number;
  limit?: number;
  period?: "all" | "upcoming" | "past";
};

function publicPageOptions(options: PublicPageOptions) {
  const query = options.q?.trim() || "";
  const period = options.period || "all";
  if (query.length > 200 || !["all", "upcoming", "past"].includes(period))
    throw new HttpError(400, "Invalid content filter.");
  const pagination = readPagination(
    new URLSearchParams({
      page: String(options.page ?? 1),
      limit: String(options.limit ?? 12),
    }),
  );
  return { ...pagination, query, period };
}

export async function getPublicContentPage(
  options: PublicPageOptions & { kinds?: readonly ContentKind[] } = {},
) {
  const { query, period, page, limit, skip } = publicPageOptions(options);
  if (
    options.kinds &&
    (options.kinds.length > contentKinds.length ||
      options.kinds.some((kind) => !contentKinds.includes(kind)))
  )
    throw new HttpError(400, "Invalid content kind.");
  const where: Prisma.CommunityContentWhereInput = {
    status: "PUBLISHED",
    sourceVerified: true,
    ...(options.kinds?.length ? { kind: { in: [...options.kinds] } } : {}),
    ...(period !== "all"
      ? {
          eventAt:
            period === "upcoming" ? { gte: new Date() } : { lt: new Date() },
        }
      : {}),
    ...(query
      ? {
          OR: [
            "titleMr",
            "titleEn",
            "summaryMr",
            "summaryEn",
            "bodyMr",
            "bodyEn",
            "location",
          ].map((field) => ({
            [field]: { contains: query, mode: "insensitive" },
          })),
        }
      : {}),
  };
  const [entries, total, settings] = await Promise.all([
    prisma.communityContent.findMany({
      where,
      select: communitySummarySelect,
      orderBy:
        period === "upcoming"
          ? [{ eventAt: "asc" }, { id: "asc" }]
          : period === "past"
            ? [{ eventAt: "desc" }, { id: "asc" }]
            : [{ featured: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
      skip,
      take: limit,
    }),
    prisma.communityContent.count({ where }),
    getPublicSiteSettings(),
  ]);
  return {
    entries: entries.map((entry) => publicContent(entry, false)),
    settings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPublicAnnouncementsPage(
  options: PublicPageOptions = {},
) {
  const { query, period, page, limit, skip } = publicPageOptions(options);
  const where: Prisma.AnnouncementWhereInput = {
    isPublished: true,
    ...(period !== "all"
      ? {
          eventDate:
            period === "upcoming" ? { gte: new Date() } : { lt: new Date() },
        }
      : {}),
    ...(query
      ? {
          OR: ["titleMr", "titleEn", "contentMr", "contentEn", "location"].map(
            (field) => ({ [field]: { contains: query, mode: "insensitive" } }),
          ),
        }
      : {}),
  };
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [
        {
          eventDate: {
            sort: period === "upcoming" ? "asc" : "desc",
            nulls: "last",
          },
        },
        { id: "asc" },
      ],
      skip,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ]);
  return {
    announcements: announcements.map((item) => ({
      ...item,
      eventDate: item.eventDate?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export type PublicContentPage = Awaited<
  ReturnType<typeof getPublicContentPage>
>;
export type PublicAnnouncementsPage = Awaited<
  ReturnType<typeof getPublicAnnouncementsPage>
>;

// Select one global page before loading either source's public payload. Paging
// two lists independently and merging them can put an earlier event on page 2.
export async function getPublicUpdatesPage(options: PublicPageOptions = {}) {
  const { query, period, page, limit, skip } = publicPageOptions(options);
  const now = new Date();
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const articleSearch = query
    ? Prisma.sql`AND CONCAT_WS(' ', c."titleMr", c."titleEn", c."summaryMr", c."summaryEn", c."bodyMr", c."bodyEn", c."location") ILIKE ${pattern}`
    : Prisma.empty;
  const announcementSearch = query
    ? Prisma.sql`AND CONCAT_WS(' ', a."titleMr", a."titleEn", a."contentMr", a."contentEn", a."location") ILIKE ${pattern}`
    : Prisma.empty;
  const periodFilter =
    period === "upcoming"
      ? Prisma.sql`WHERE "eventAt" >= ${now}`
      : period === "past"
        ? Prisma.sql`WHERE "eventAt" < ${now}`
        : Prisma.empty;
  const order =
    period === "upcoming"
      ? Prisma.sql`"eventAt" ASC, "key" COLLATE "C" ASC`
      : period === "past"
        ? Prisma.sql`"eventAt" DESC, "key" COLLATE "C" ASC`
        : Prisma.sql`CASE WHEN "eventAt" >= ${now} THEN 0 ELSE 1 END ASC,
          CASE WHEN "eventAt" >= ${now} THEN "eventAt" END ASC,
          CASE WHEN "eventAt" >= ${now} THEN NULL ELSE COALESCE("eventAt", "updatedAt") END DESC,
          "key" COLLATE "C" ASC`;
  type SelectedUpdate = {
    total: bigint;
    source: "community" | "announcement" | null;
    id: string | null;
  };
  return prisma.$transaction(
    async (transaction) => {
      const selected = await transaction.$queryRaw<SelectedUpdate[]>(Prisma.sql`
      WITH candidates AS (
        SELECT c."id", 'community' AS "source", 'article-' || c."id" AS "key", c."eventAt", c."updatedAt"
        FROM "CommunityContent" c
        WHERE c."status" = 'PUBLISHED' AND c."sourceVerified" = TRUE
          AND c."kind" IN ('EVENT', 'NEWS', 'INITIATIVE') ${articleSearch}
        UNION ALL
        SELECT a."id", 'announcement' AS "source", 'notice-' || a."id" AS "key", a."eventDate" AS "eventAt", a."updatedAt"
        FROM "Announcement" a WHERE a."isPublished" = TRUE ${announcementSearch}
      ), filtered AS (
        SELECT * FROM candidates ${periodFilter}
      ), selected_page AS (
        SELECT "id", "source" FROM filtered ORDER BY ${order} OFFSET ${skip} LIMIT ${limit}
      )
      SELECT totals."total", selected_page."source", selected_page."id"
      FROM (SELECT COUNT(*) AS "total" FROM filtered) totals
      LEFT JOIN selected_page ON TRUE
    `);
      const total = Number(selected[0]?.total ?? 0);
      if (!Number.isSafeInteger(total))
        throw new HttpError(
          503,
          "The updates list is unavailable. Please try again.",
        );
      const articleIds = selected
        .filter((item) => item.source === "community" && item.id)
        .map((item) => item.id!);
      const announcementIds = selected
        .filter((item) => item.source === "announcement" && item.id)
        .map((item) => item.id!);
      const [entries, announcements] = await Promise.all([
        articleIds.length
          ? transaction.communityContent.findMany({
              where: {
                id: { in: articleIds },
                status: "PUBLISHED",
                sourceVerified: true,
              },
              select: communitySummarySelect,
              take: limit,
            })
          : [],
        announcementIds.length
          ? transaction.announcement.findMany({
              where: { id: { in: announcementIds }, isPublished: true },
              select: {
                id: true,
                titleMr: true,
                titleEn: true,
                slug: true,
                contentMr: true,
                contentEn: true,
                category: true,
                eventDate: true,
                location: true,
                isPublished: true,
                createdAt: true,
                updatedAt: true,
              },
              take: limit,
            })
          : [],
      ]);
      return {
        entries: entries.map((entry) => publicContent(entry, false)),
        announcements: announcements.map((item) => ({
          ...item,
          eventDate: item.eventDate?.toISOString() || null,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export type PublicUpdatesPage = Awaited<
  ReturnType<typeof getPublicUpdatesPage>
>;
