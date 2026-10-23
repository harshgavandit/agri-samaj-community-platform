import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  getPublicAssistantCorpus,
  getPublicCommunitySnapshot,
  getPublicContentPage,
  getPublicAnnouncementsPage,
  getPublicUpdatesPage,
} from "../src/lib/public-data";
import { GET as communityApi } from "../src/app/api/community/route";
import { GET as announcementsApi } from "../src/app/api/announcements/route";
import { GET as updatesApi } from "../src/app/api/updates/route";

const restores: (() => void)[] = [];
function stub<T extends object, K extends keyof T>(
  target: T,
  key: K,
  replacement: T[K],
) {
  const previous = target[key];
  target[key] = replacement;
  restores.push(() => {
    target[key] = previous;
  });
}

test.beforeEach(() => {
  const entries = new Map<string, unknown>();
  Reflect.set(globalThis, "__incrementalCache", {
    generateSimpleCacheKey: async (key: string) => key,
    get: async (key: string) =>
      entries.has(key) ? { value: entries.get(key), isStale: false } : null,
    set: async (key: string, value: unknown) => {
      entries.set(key, value);
    },
  });
});

test.afterEach(() => {
  for (const restore of restores.splice(0).reverse()) restore();
  Reflect.deleteProperty(globalThis, "__incrementalCache");
});

test("shared community snapshot caches public summaries without article bodies or editorial fields", async () => {
  const now = new Date("2026-10-24T10:00:00Z");
  let reads = 0;
  let query: { where?: unknown; select?: Record<string, unknown> } = {};
  stub(prisma.communityContent, "findMany", (async (input: typeof query) => {
    reads += 1;
    query = input;
    return [
      {
        id: "guide",
        slug: "community-guide",
        kind: "RESOURCE",
        titleMr: "समुदाय",
        titleEn: "Community",
        summaryMr: "मार्गदर्शन",
        summaryEn: "Guidance",
        sources: [{ label: "Official", url: "https://www.ncs.gov.in/" }],
        sourceNoteMr: "",
        sourceNoteEn: "",
        period: "EVERGREEN",
        featured: true,
        coverImageUrl: null,
        coverCredit: null,
        actionUrl: null,
        eventAt: now,
        location: "Panvel",
        verifiedAt: now,
        updatedAt: now,
      },
    ];
  }) as unknown as typeof prisma.communityContent.findMany);
  stub(
    prisma.siteSettings,
    "findUnique",
    (async () => null) as typeof prisma.siteSettings.findUnique,
  );
  const first = await getPublicCommunitySnapshot();
  const second = await getPublicCommunitySnapshot();
  assert.deepEqual(first, second);
  assert.equal(reads, 1);
  assert.deepEqual(query.where, { status: "PUBLISHED", sourceVerified: true });
  for (const field of ["bodyMr", "bodyEn", "editorNotes", "reviewedBy"])
    assert.equal(field in (query.select || {}), false);
  assert.equal(first.entries[0].bodyMr, "");
  assert.equal(first.entries[0].eventAt, now.toISOString());
  assert.equal(first.entries[0].verifiedAt, now.toISOString());
  assert.equal(first.entries[0].updatedAt, now.toISOString());
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
});

test("assistant corpus cache bounds bilingual excerpts and reads only published verified sources once", async () => {
  let reads = 0;
  let query: {
    where?: unknown;
    select?: Record<string, unknown>;
    take?: number;
  } = {};
  stub(prisma.communityContent, "findMany", (async (input: typeof query) => {
    reads += 1;
    query = input;
    return [
      {
        slug: "verified-guide",
        titleMr: "समुदाय",
        titleEn: "Community",
        summaryMr: "मार्गदर्शन",
        summaryEn: "Guidance",
        bodyMr: "अ".repeat(6000),
        bodyEn: "A".repeat(6000),
        sourceNoteMr: "",
        sourceNoteEn: "",
        eventAt: new Date("2026-10-24T10:00:00Z"),
        location: null,
      },
    ];
  }) as unknown as typeof prisma.communityContent.findMany);
  const first = await getPublicAssistantCorpus();
  const second = await getPublicAssistantCorpus();
  assert.deepEqual(first, second);
  assert.equal(reads, 1);
  assert.deepEqual(query.where, { status: "PUBLISHED", sourceVerified: true });
  assert.equal(query.take, 100);
  for (const field of ["editorNotes", "reviewedBy", "revision"])
    assert.equal(field in (query.select || {}), false);
  assert.equal(first[0].bodyMr.length, 1800);
  assert.equal(first[0].bodyEn.length, 1800);
  assert.equal(typeof first[0].eventAt, "string");
});

test("community pagination applies kind and bilingual search before the database window and reports all matching pages", async () => {
  let query: Record<string, unknown> = {};
  let countWhere: unknown;
  stub(prisma.communityContent, "findMany", (async (
    input: Record<string, unknown>,
  ) => {
    query = input;
    return [];
  }) as unknown as typeof prisma.communityContent.findMany);
  stub(prisma.communityContent, "count", (async (input: { where: unknown }) => {
    countWhere = input.where;
    return 121;
  }) as unknown as typeof prisma.communityContent.count);
  stub(
    prisma.siteSettings,
    "findUnique",
    (async () => null) as typeof prisma.siteSettings.findUnique,
  );
  const response = await getPublicContentPage({
    kinds: ["RESOURCE", "EDUCATION"],
    q: "Panvel",
    page: 2,
    limit: 12,
  });
  assert.deepEqual(response.pagination, {
    page: 2,
    limit: 12,
    total: 121,
    totalPages: 11,
  });
  assert.equal(query.skip, 12);
  assert.equal(query.take, 12);
  assert.deepEqual(countWhere, query.where);
  const where = query.where as {
    status: string;
    sourceVerified: boolean;
    kind: unknown;
    OR: Record<string, unknown>[];
  };
  assert.equal(where.status, "PUBLISHED");
  assert.equal(where.sourceVerified, true);
  assert.deepEqual(where.kind, { in: ["RESOURCE", "EDUCATION"] });
  assert(where.OR.some((item) => "titleMr" in item));
  assert(where.OR.some((item) => "titleEn" in item));
  assert(where.OR.some((item) => "bodyMr" in item));
  assert(where.OR.some((item) => "bodyEn" in item));
  assert(where.OR.some((item) => "location" in item));
  assert.equal("editorNotes" in (query.select as object), false);
});

test("announcement pagination filters upcoming dates and location in SQL and keeps stable chronological order", async () => {
  let query: Record<string, unknown> = {};
  stub(prisma.announcement, "findMany", (async (
    input: Record<string, unknown>,
  ) => {
    query = input;
    return [];
  }) as unknown as typeof prisma.announcement.findMany);
  stub(
    prisma.announcement,
    "count",
    (async () => 31) as typeof prisma.announcement.count,
  );
  const response = await getPublicAnnouncementsPage({
    period: "upcoming",
    q: "Panvel",
    page: 3,
    limit: 10,
  });
  assert.deepEqual(response.pagination, {
    page: 3,
    limit: 10,
    total: 31,
    totalPages: 4,
  });
  assert.equal(query.skip, 20);
  assert.equal(query.take, 10);
  const where = query.where as {
    isPublished: boolean;
    eventDate: { gte: Date };
    OR: Record<string, unknown>[];
  };
  assert.equal(where.isPublished, true);
  assert(where.eventDate.gte instanceof Date);
  assert(where.OR.some((item) => "location" in item));
  assert.deepEqual(query.orderBy, [
    { eventDate: { sort: "asc", nulls: "last" } },
    { id: "asc" },
  ]);
});

test("public content APIs reject unsupported filters and unbounded pages before database access", async () => {
  for (const query of [
    "kinds=RESOURCE,PRIVATE",
    "kind=NOT_A_KIND",
    "limit=101",
    "page=0",
    "period=unknown",
    `q=${"a".repeat(201)}`,
  ]) {
    assert.equal(
      (
        await communityApi(
          new Request(`https://community.example.test/api/community?${query}`),
        )
      ).status,
      400,
    );
  }
  for (const query of [
    "period=unknown",
    "limit=101",
    "page=-1",
    `q=${"a".repeat(201)}`,
  ]) {
    assert.equal(
      (
        await announcementsApi(
          new Request(
            `https://community.example.test/api/announcements?${query}`,
          ),
        )
      ).status,
      400,
    );
  }
});

test("unified updates select one bounded union window with parameterized fullbody search before fetching public payloads", async () => {
  let sqlText = "";
  let sqlValues: unknown[] = [];
  let articleQuery: Record<string, unknown> = {};
  let announcementQuery: Record<string, unknown> = {};
  const search = "literal%_' OR true --";
  const transaction = {
    $queryRaw: async (query: { sql: string; values: unknown[] }) => {
      sqlText = query.sql;
      sqlValues = query.values;
      return [
        { total: BigInt(14), source: "community", id: "early-event" },
        { total: BigInt(14), source: "announcement", id: "january-event" },
      ];
    },
    communityContent: {
      findMany: async (input: Record<string, unknown>) => {
        articleQuery = input;
        return [];
      },
    },
    announcement: {
      findMany: async (input: Record<string, unknown>) => {
        announcementQuery = input;
        return [];
      },
    },
  };
  stub(prisma, "$transaction", (async (
    work: (value: typeof transaction) => Promise<unknown>,
    options: unknown,
  ) => {
    assert.deepEqual(options, { isolationLevel: "RepeatableRead" });
    return work(transaction);
  }) as unknown as typeof prisma.$transaction);
  const result = await getPublicUpdatesPage({
    q: search,
    period: "upcoming",
    page: 2,
    limit: 12,
  });
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 12,
    total: 14,
    totalPages: 2,
  });
  assert.match(sqlText, /UNION ALL/);
  assert.match(sqlText, /"bodyMr".*"bodyEn"/);
  assert.match(sqlText, /SELECT "id", "source" FROM filtered ORDER BY/);
  assert.match(sqlText, /OFFSET \? LIMIT \?/);
  assert.equal(sqlText.includes(search), false);
  assert(sqlValues.includes("%literal\\%\\_' OR true --%"));
  assert.deepEqual(articleQuery.where, {
    id: { in: ["early-event"] },
    status: "PUBLISHED",
    sourceVerified: true,
  });
  assert.equal(articleQuery.take, 12);
  assert.equal("editorNotes" in (articleQuery.select as object), false);
  assert.deepEqual(announcementQuery.where, {
    id: { in: ["january-event"] },
    isPublished: true,
  });
  assert.equal(announcementQuery.take, 12);
});

test("unified updates preserve total count for an empty or out-of-range page and reject invalid API filters", async () => {
  const transaction = {
    $queryRaw: async () => [{ total: BigInt(14), source: null, id: null }],
  };
  stub(prisma, "$transaction", (async (
    work: (value: typeof transaction) => Promise<unknown>,
  ) => work(transaction)) as unknown as typeof prisma.$transaction);
  const result = await getPublicUpdatesPage({ page: 3, limit: 12 });
  assert.deepEqual(result, {
    entries: [],
    announcements: [],
    pagination: { page: 3, limit: 12, total: 14, totalPages: 2 },
  });
  for (const query of [
    "page=0",
    "limit=101",
    "period=unknown",
    `q=${"a".repeat(201)}`,
  ])
    assert.equal(
      (
        await updatesApi(
          new Request(`https://community.example.test/api/updates?${query}`),
        )
      ).status,
      400,
    );
});
