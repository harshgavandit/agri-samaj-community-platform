import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import {
  directoryHref,
  directoryQuery,
  emptyDirectoryFilters,
  parseDirectoryFilters,
} from "../src/lib/directory-filters";
import { HttpError } from "../src/lib/http";
import { prisma } from "../src/lib/prisma";
import {
  SAVED_BUSINESS_LIMIT,
  saveBusiness,
} from "../src/lib/saved-businesses";

test("directory links retain bilingual search, filters, sort and page across round trips", () => {
  const filters = {
    q: "स्थापत्य सेवा & design",
    category: "engineering",
    district: "रायगड",
    classification: "PROFESSIONAL",
    sort: "name" as const,
    page: 3,
  };
  assert.deepEqual(parseDirectoryFilters(directoryQuery(filters)), filters);
  assert.match(directoryHref(filters), /^\/directory\?q=/);
  assert.equal(directoryHref(emptyDirectoryFilters), "/directory");
});

test("directory URL parser bounds pagination and rejects unsupported filters without forwarding tracking parameters", () => {
  for (const page of [
    "-1",
    "1.5",
    "Infinity",
    "NaN",
    "100001",
    "9999999999999999999999",
  ]) {
    assert.equal(parseDirectoryFilters(new URLSearchParams({ page })).page, 1);
  }
  const filters = parseDirectoryFilters(
    new URLSearchParams({
      sort: "untrusted",
      classification: "ADMIN",
      q: " x ",
      utm_source: "tracking",
    }),
  );
  assert.equal(filters.q, "x");
  assert.equal(filters.sort, "recent");
  assert.equal(filters.classification, "");
  assert.equal(directoryHref(filters), "/directory?q=x");
  assert.equal(
    parseDirectoryFilters(new URLSearchParams({ q: "a".repeat(900) })).q.length,
    200,
  );
});

test("shortlist only saves approved listings and scopes the composite identity to the member", async (context) => {
  const calls: unknown[] = [];
  const record = { userId: "member-a", businessProfileId: "public-business" };
  context.mock.method(
    prisma,
    "$transaction",
    async (callback: (transaction: unknown) => unknown, options: unknown) => {
      assert.deepEqual(options, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      return callback({
        businessProfile: {
          findFirst: async (query: unknown) => {
            calls.push(query);
            return { id: "public-business" };
          },
        },
        savedBusiness: {
          findUnique: async (query: unknown) => {
            calls.push(query);
            return null;
          },
          count: async (query: unknown) => {
            calls.push(query);
            return 0;
          },
          create: async (query: unknown) => {
            calls.push(query);
            return record;
          },
        },
      });
    },
  );
  assert.deepEqual(await saveBusiness("member-a", "public-business"), record);
  assert.deepEqual(calls, [
    {
      where: { id: "public-business", status: "APPROVED" },
      select: { id: true },
    },
    { where: { userId_businessProfileId: record } },
    { where: { userId: "member-a" } },
    { data: record },
  ]);
});

test("shortlist rejects unpublished targets before any save or capacity query", async (context) => {
  context.mock.method(
    prisma,
    "$transaction",
    async (callback: (transaction: unknown) => unknown) =>
      callback({
        businessProfile: { findFirst: async () => null },
        savedBusiness: {
          create: () => assert.fail("Unpublished record must not be saved"),
        },
      }),
  );
  await assert.rejects(
    saveBusiness("member", "draft"),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("repeated saves remain idempotent even when a member is at capacity", async (context) => {
  const existing = { userId: "member", businessProfileId: "approved" };
  context.mock.method(
    prisma,
    "$transaction",
    async (callback: (transaction: unknown) => unknown) =>
      callback({
        businessProfile: { findFirst: async () => ({ id: "approved" }) },
        savedBusiness: {
          findUnique: async () => existing,
          count: () =>
            assert.fail("Existing saves do not consume another slot"),
          create: () =>
            assert.fail("Existing saves must not create duplicates"),
        },
      }),
  );
  assert.deepEqual(await saveBusiness("member", "approved"), existing);
});

test("shortlist capacity is enforced before insertion", async (context) => {
  context.mock.method(
    prisma,
    "$transaction",
    async (callback: (transaction: unknown) => unknown) =>
      callback({
        businessProfile: { findFirst: async () => ({ id: "approved" }) },
        savedBusiness: {
          findUnique: async () => null,
          count: async () => SAVED_BUSINESS_LIMIT,
          create: () => assert.fail("Full shortlist must not grow"),
        },
      }),
  );
  await assert.rejects(
    saveBusiness("member", "approved"),
    (error: unknown) => error instanceof HttpError && error.status === 409,
  );
});

test("shortlist retries serializable conflicts and stops with a retryable response after three attempts", async (context) => {
  let attempts = 0;
  context.mock.method(prisma, "$transaction", async () => {
    attempts += 1;
    throw { code: "P2034" };
  });
  await assert.rejects(
    saveBusiness("member", "approved"),
    (error: unknown) => error instanceof HttpError && error.status === 503,
  );
  assert.equal(attempts, 3);
});

test("parallel identical save conflicts resolve only the same member's composite key", async (context) => {
  context.mock.method(prisma, "$transaction", async () => {
    throw { code: "P2002" };
  });
  const record = { userId: "member-b", businessProfileId: "same-business" };
  const findUnique = prisma.savedBusiness.findUnique;
  context.after(() => {
    prisma.savedBusiness.findUnique = findUnique;
  });
  prisma.savedBusiness.findUnique = (async (query: unknown) => {
    assert.deepEqual(query, { where: { userId_businessProfileId: record } });
    return record;
  }) as unknown as typeof prisma.savedBusiness.findUnique;
  assert.deepEqual(await saveBusiness("member-b", "same-business"), record);
});
