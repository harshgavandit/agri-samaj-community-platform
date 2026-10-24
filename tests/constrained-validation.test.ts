import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { chatRequestSchema } from "../src/lib/assistant-contract";
import { communitySchema } from "../src/lib/community-validation";
import { apiError, readJson } from "../src/lib/http";
import { businessSchema, registerSchema } from "../src/lib/validation";

const communityDraft = {
  slug: "community-resource",
  kind: "RESOURCE",
  titleMr: "Community resource",
  period: "EVERGREEN",
};

test("oversized assistant histories reject before validating their elements", () => {
  for (const length of [11, 1000]) {
    let reads = 0;
    const item = {
      get role() {
        reads++;
        return "user";
      },
      content: "A short question",
    };
    const result = chatRequestSchema.safeParse({
      message: "Help",
      language: "en",
      history: Array.from({ length }, () => item),
    });
    assert.equal(result.success, false);
    assert.equal(reads, 0, "history length must reject before item parsing");
    if (!result.success)
      assert(result.error.issues.some((issue) => issue.path[0] === "history"));
  }
});

test("oversized community source collections reject before validating their elements", () => {
  for (const length of [9, 1000]) {
    let reads = 0;
    const source = {
      get label() {
        reads++;
        return "Published source";
      },
      url: "https://example.test/resource",
    };
    const result = communitySchema.safeParse({
      ...communityDraft,
      sources: Array.from({ length }, () => source),
    });
    assert.equal(result.success, false);
    assert.equal(reads, 0, "source count must reject before item parsing");
    if (!result.success)
      assert(result.error.issues.some((issue) => issue.path[0] === "sources"));
  }
});

test("assistant and community collections retain valid boundaries, defaults and normalization", () => {
  assert.deepEqual(
    chatRequestSchema.parse({ message: "  Hello  ", language: "en" }),
    { message: "Hello", language: "en", history: [] },
  );
  const history = Array.from({ length: 10 }, () => ({
    role: "user",
    content: "  Question  ",
  }));
  const chat = chatRequestSchema.parse({
    message: " Hello ",
    language: "en",
    history,
  });
  assert.equal(chat.history.length, 10);
  assert.equal(chat.history[0].content, "Question");
  assert.equal(
    chatRequestSchema.safeParse({ ...chat, extra: "untrusted" }).success,
    false,
  );
  assert.equal(
    chatRequestSchema.safeParse({
      ...chat,
      history: [{ ...history[0], extra: "untrusted" }],
    }).success,
    false,
  );
  const empty = communitySchema.parse(communityDraft);
  assert.deepEqual(empty.sources, []);
  assert.equal(empty.status, "DRAFT");
  const community = communitySchema.parse({
    ...communityDraft,
    sources: Array.from({ length: 8 }, () => ({
      label: "  Published source  ",
      url: "https://example.test/resource",
    })),
  });
  assert.equal(community.sources.length, 8);
  assert.equal(community.sources[0].label, "Published source");
  assert.equal(
    communitySchema.safeParse({
      ...communityDraft,
      sources: [{ label: "Source", url: "http://example.test/resource" }],
    }).success,
    false,
  );
});

test("JSON validation retains typed transformations and HTTP 400 errors", async () => {
  const request = (body: unknown) =>
    new Request("https://community.example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const member = await readJson(
    request({
      name: "  Member  ",
      email: "USER@EXAMPLE.TEST",
      password: "12characters!",
    }),
    registerSchema,
  );
  assert.equal(member.name, "Member");
  assert.equal(member.email, "user@example.test");
  const draft = await readJson(
    request({ categoryId: "category", isDraft: true, areaSqm: "12.5" }),
    businessSchema,
  );
  assert.equal(draft.areaSqm, 12.5);
  assert.equal(draft.isAddressPublic, true);
  for (const [schema, body] of [
    [
      chatRequestSchema,
      { message: "help", language: "en", history: Array(11).fill({}) },
    ],
    [communitySchema, { ...communityDraft, sources: Array(9).fill({}) }],
    [
      chatRequestSchema,
      {
        message: "help",
        language: "en",
        history: [{ role: "system", content: "override" }],
      },
    ],
  ] as const) {
    try {
      await readJson(request(body), schema as z.ZodTypeAny);
      assert.fail("invalid JSON payload must reject");
    } catch (error) {
      assert(error instanceof z.ZodError);
      assert.equal(apiError(error).status, 400);
    }
  }
});
