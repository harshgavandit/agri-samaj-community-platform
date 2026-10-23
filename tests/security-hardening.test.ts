import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  clientAddress,
  HttpError,
  rateLimit,
  readBytes,
  readJson,
  apiError,
} from "../src/lib/http";
import { verifyToken, signToken, hashPassword } from "../src/lib/auth";
import { publicBusinessSelect } from "../src/lib/business";
import { openaiRequest, narrate } from "../src/lib/assistant-provider";
import { prisma } from "../src/lib/prisma";
import { POST as login } from "../src/app/api/auth/login/route";
import { readPagination } from "../src/lib/pagination";

const originalEnvironment = { ...process.env };
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

test.afterEach(() => {
  for (const restore of restores.splice(0).reverse()) restore();
  for (const name of [
    "VERCEL",
    "TRUST_PROXY",
    "JWT_SECRET",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
  ]) {
    if (originalEnvironment[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnvironment[name];
  }
});

test("client IP admission ignores untrusted proxy headers and validates trusted values", () => {
  delete process.env.VERCEL;
  process.env.TRUST_PROXY = "false";
  const request = (ip: string) =>
    new Request("https://community.example.test", {
      headers: { "x-forwarded-for": ip },
    });
  assert.equal(clientAddress(request("203.0.113.4")), "anonymous");
  process.env.VERCEL = "1";
  assert.equal(clientAddress(request("203.0.113.4, 10.0.0.1")), "203.0.113.4");
  assert.equal(clientAddress(request("user-controlled-text")), "anonymous");
  assert.equal(clientAddress(request("2001:DB8::1")), "2001:db8::1");
  delete process.env.VERCEL;
  process.env.TRUST_PROXY = "true";
  assert.equal(clientAddress(request("203.0.113.5")), "203.0.113.5");
});

test("persistent limits use distinct visitor buckets and survive cleanup failure without bypassing admission", async () => {
  process.env.VERCEL = "1";
  const keys: string[] = [];
  let count = 1;
  stub(prisma.rateLimit, "upsert", (async (input: {
    where: { key: string };
  }) => {
    keys.push(input.where.key);
    return { count };
  }) as unknown as typeof prisma.rateLimit.upsert);
  stub(prisma.rateLimit, "deleteMany", (async () => {
    throw new Error("maintenance failed");
  }) as typeof prisma.rateLimit.deleteMany);
  const request = (ip: string) =>
    new Request("https://community.example.test", {
      headers: { "x-forwarded-for": ip },
    });
  await rateLimit(request("203.0.113.1"), "unit-security", 2);
  await rateLimit(request("203.0.113.2"), "unit-security", 2);
  assert.notEqual(keys[0], keys[1]);
  count = 3;
  await assert.rejects(
    rateLimit(request("203.0.113.1"), "unit-security", 2),
    (error: unknown) => {
      assert(error instanceof HttpError);
      assert.equal(error.status, 429);
      assert(
        error.retryAfter && error.retryAfter >= 1 && error.retryAfter <= 60,
      );
      assert.equal(
        Number(apiError(error).headers.get("Retry-After")),
        error.retryAfter,
      );
      return true;
    },
  );
  stub(prisma.rateLimit, "upsert", (async () => {
    throw new Error("admission database unavailable");
  }) as typeof prisma.rateLimit.upsert);
  await assert.rejects(
    rateLimit(request("203.0.113.3"), "unit-security"),
    /admission database unavailable/,
  );
});

test("session verification rejects signed malformed claims and tokens without expiration", () => {
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  const payload = {
    userId: "member-id",
    email: "member@example.test",
    name: "Member",
    role: "MEMBER" as const,
  };
  assert.equal(verifyToken(signToken(payload))?.userId, payload.userId);
  const options = {
    algorithm: "HS256" as const,
    issuer: "agri-samaj",
    audience: "agri-samaj-web",
  };
  for (const malformed of [
    { ...payload, role: "OWNER" },
    { ...payload, email: 123 },
    { ...payload, userId: "" },
    { ...payload, name: null },
  ]) {
    const signed: string = jwt.sign(malformed, process.env.JWT_SECRET, {
      ...options,
      expiresIn: "1h",
    });
    assert.equal(verifyToken(signed), null);
  }
  assert.equal(
    verifyToken(jwt.sign(payload, process.env.JWT_SECRET, options)),
    null,
  );
});

test("directory query allowlist excludes private verification and reviewer fields", () => {
  for (const field of [
    "userId",
    "ownerPhone",
    "ownerEmail",
    "documentUrl",
    "adminNotes",
    "rejectionReason",
    "registrationNumber",
    "termsAccepted",
  ]) {
    assert.equal(
      field in publicBusinessSelect,
      false,
      `${field} must not be fetched by public queries`,
    );
  }
  assert.equal(publicBusinessSelect.businessName, true);
  assert.equal(publicBusinessSelect.isAddressPublic, true);
});

test("streamed request bounds cancel excess data and reject JSON-like media types", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(80));
      controller.enqueue(new Uint8Array(80));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("https://community.example.test", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(
    readBytes(request, 100),
    (error: unknown) => error instanceof HttpError && error.status === 413,
  );
  assert.equal(cancelled, true);
  await assert.rejects(
    readJson(
      new Request("https://community.example.test", {
        method: "POST",
        headers: { "Content-Type": "application/jsonp" },
        body: "{}",
      }),
      z.object({}),
    ),
    (error: unknown) => error instanceof HttpError && error.status === 415,
  );
  assert.deepEqual(
    await readJson(
      new Request("https://community.example.test", {
        method: "POST",
        headers: { "Content-Type": "Application/JSON; charset=utf-8" },
        body: "{}",
      }),
      z.object({}),
    ),
    {},
  );
});

test("cancelled AI operations never start a provider request", async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  const controller = new AbortController();
  controller.abort();
  const cancelled = (error: unknown) =>
    error instanceof HttpError && error.status === 499;
  await assert.rejects(
    openaiRequest("responses", "{}", controller.signal),
    cancelled,
  );
  await assert.rejects(
    narrate("A synthetic answer.", "en", controller.signal),
    cancelled,
  );
});

test("login uses the same credential failure for unknown, disabled and invalid-role accounts", async () => {
  const password = "A synthetic secure password 123!";
  const user = {
    id: "unit-login-member",
    email: "member@example.test",
    name: "Member",
    role: "MEMBER",
    isActive: true,
    passwordHash: await hashPassword(password),
  };
  let account: typeof user | null = null;
  stub(
    prisma.user,
    "findUnique",
    (async () => account) as unknown as typeof prisma.user.findUnique,
  );
  stub(prisma.rateLimit, "upsert", (async () => ({
    count: 1,
  })) as unknown as typeof prisma.rateLimit.upsert);
  stub(prisma.rateLimit, "deleteMany", (async () => ({
    count: 0,
  })) as typeof prisma.rateLimit.deleteMany);
  const request = (candidatePassword: string) =>
    new Request("https://community.example.test/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: candidatePassword }),
    });
  const unknown = await login(request(password));
  assert.equal(unknown.status, 401);
  const failure = await unknown.json();
  for (const candidate of [
    { ...user, isActive: false },
    { ...user, role: "UNSUPPORTED" },
    user,
  ]) {
    account = candidate;
    const response = await login(
      request(candidate === user ? "An incorrect password 123!" : password),
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), failure);
    assert.equal(response.headers.has("Set-Cookie"), false);
  }
});

test("admin pagination bounds reject oversized and invalid windows while preserving deep-page offsets", () => {
  assert.deepEqual(readPagination(new URLSearchParams()), {
    page: 1,
    limit: 25,
    skip: 0,
  });
  assert.deepEqual(readPagination(new URLSearchParams("page=3&limit=5")), {
    page: 3,
    limit: 5,
    skip: 10,
  });
  for (const input of [
    "page=0",
    "page=-1",
    "page=1.5",
    "page=Infinity",
    "page=100001",
    "limit=0",
    "limit=101",
    "limit=NaN",
  ])
    assert.throws(
      () => readPagination(new URLSearchParams(input)),
      (error: unknown) => error instanceof HttpError && error.status === 400,
    );
});
