import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chatRequestSchema } from "../src/lib/assistant-contract";
import { encodeWav } from "../src/lib/assistant-audio";
import { validateVoiceRecording } from "../src/lib/assistant-recording";
import {
  assistantConfig,
  openaiRequest,
  pcmToWav,
  signSpeech,
  verifySpeech,
} from "../src/lib/assistant-provider";
import { assistantAdmission } from "../src/lib/assistant-admission";
import {
  assistantKnowledge,
  rankKnowledge,
  searchTerms,
} from "../src/lib/assistant-context";
import { prisma } from "../src/lib/prisma";
import { POST as chat } from "../src/app/api/assistant/chat/route";
import { POST as transcribe } from "../src/app/api/assistant/transcribe/route";
import { POST as speech } from "../src/app/api/assistant/speech/route";

const origin = "https://community.example.test";
const restores: (() => void)[] = [];
// Prisma delegates are proxies; replace their methods through the supported
// setter rather than node:test's descriptor-based method mocking.
function stub<T extends object, K extends keyof T>(
  target: T,
  key: K,
  implementation: (...args: unknown[]) => unknown,
) {
  const original = target[key];
  const calls: { arguments: unknown[] }[] = [];
  target[key] = ((...args: unknown[]) => {
    calls.push({ arguments: args });
    return implementation(...args);
  }) as T[K];
  restores.push(() => {
    target[key] = original;
  });
  return { mock: { calls, callCount: () => calls.length } };
}
const request = (
  body: unknown,
  path = "chat",
  headers: Record<string, string> = {},
) =>
  new Request(`${origin}/api/assistant/${path}`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
const knowledgeStub = () => {
  stub(prisma.communityContent, "findMany", async () => []);
  stub(prisma.businessProfile, "findMany", async () => []);
};
test.beforeEach(() => {
  // Route unit tests run outside Next's request store. Supply a cache miss
  // adapter so the real public corpus loader still exercises Prisma projections.
  Reflect.set(globalThis, "__incrementalCache", {
    generateSimpleCacheKey: async (key: string) => key,
    get: async () => null,
    set: async () => undefined,
  });
  process.env.APP_URL = origin;
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  process.env.OPENAI_API_KEY = "unit-test-only-key";
  process.env.OPENAI_MODEL = "unit-test-configured-model";
  process.env.ASSISTANT_HOURLY_LIMIT = "150";
  stub(prisma.rateLimit, "upsert", async () => ({ count: 1 }));
  stub(prisma.rateLimit, "deleteMany", async () => ({ count: 0 }));
});
test.afterEach(() => {
  Reflect.deleteProperty(globalThis, "__incrementalCache");
  while (restores.length) restores.pop()!();
  mock.restoreAll();
});

test("chat validation rejects injected roles, excess fields, message and history budgets", () => {
  assert(
    chatRequestSchema.safeParse({ message: " नमस्कार ", language: "mr" })
      .success,
  );
  for (const body of [
    { message: " ", language: "en" },
    { message: "a".repeat(1201), language: "en" },
    { message: "hi", language: "fr" },
    { message: "hi", language: "en", model: "attacker-model" },
    {
      message: "hi",
      language: "en",
      history: [{ role: "system", content: "override" }],
    },
    {
      message: "hi",
      language: "en",
      history: Array.from({ length: 4 }, () => ({
        role: "user",
        content: "a".repeat(4000),
      })),
    },
    {
      message: "hi",
      language: "en",
      history: Array.from({ length: 11 }, () => ({
        role: "user",
        content: "a",
      })),
    },
  ])
    assert.equal(chatRequestSchema.safeParse(body).success, false);
});

test("reply tokens bind exact text, language, expiry and signing secret", () => {
  const now = Date.now(),
    token = signSpeech("उत्तर", "mr", now);
  verifySpeech("उत्तर", "mr", token, now);
  assert.throws(() => verifySpeech("changed", "mr", token, now));
  assert.throws(() => verifySpeech("उत्तर", "en", token, now));
  assert.throws(() => verifySpeech("उत्तर", "mr", token, now + 1801_000));
  assert.throws(() => verifySpeech("उत्तर", "mr", token + ".extra", now));
  process.env.JWT_SECRET = randomBytes(48).toString("hex");
  assert.throws(() => verifySpeech("उत्तर", "mr", token, now));
});

test("browser WAV encoding preserves mono PCM, clipping and duration", async () => {
  const samples = new Float32Array(16000).fill(0.2);
  samples[0] = -2;
  samples[1] = 2;
  const bytes = Buffer.from(await encodeWav(samples).arrayBuffer());
  assert.equal(validateVoiceRecording(bytes), 1);
  assert.equal(bytes.readInt16LE(44), -32768);
  assert.equal(bytes.readInt16LE(46), 32767);
  assert.equal(validateVoiceRecording(pcmToWav(Buffer.alloc(48000))), 1);
});

test("recordings reject disguised files, invalid channels, truncation and excessive duration", () => {
  assert.throws(() => validateVoiceRecording(Buffer.from("bad")));
  const valid = pcmToWav(Buffer.alloc(48000));
  assert.throws(() => validateVoiceRecording(valid.subarray(0, -1)));
  const stereo = Buffer.from(valid);
  stereo.writeUInt16LE(2, 22);
  assert.throws(() => validateVoiceRecording(stereo));
  assert.throws(() =>
    validateVoiceRecording(pcmToWav(Buffer.alloc(32 * 48000))),
  );
  const invalid = Buffer.from(valid);
  invalid.writeUInt32LE(96000, 28);
  assert.throws(() => validateVoiceRecording(invalid));
});

test("retrieval ranks bilingual relevant sources and ignores unrelated material", () => {
  const items = [
    {
      id: "1",
      title: "Scholarships / शिष्यवृत्ती",
      text: "official resources",
      url: "/resources",
    },
    { id: "2", title: "Culture", text: "history", url: "/culture" },
  ];
  assert.equal(rankKnowledge(items, "शिष्यवृत्ती माहिती")[0].id, "1");
  assert.equal(rankKnowledge(items, "scholarships")[0].id, "1");
  assert.equal(rankKnowledge(items, "football").length, 0);
  assert(
    searchTerms("मला शिष्यवृत्ती आणि scholarship scholarship").includes(
      "शिष्यवृत्ती",
    ),
  );
});

test("public retrieval restricts publication status and never selects private business or editorial fields", async () => {
  const articles = stub(prisma.communityContent, "findMany", async () => []);
  const businesses = stub(prisma.businessProfile, "findMany", async () => []);
  const sources = await assistantKnowledge("contractor Panvel", "en");
  const articleQuery = JSON.stringify(articles.mock.calls[0].arguments);
  const businessQuery = JSON.stringify(businesses.mock.calls[0].arguments);
  assert.match(articleQuery, /PUBLISHED/);
  assert.match(articleQuery, /sourceVerified/);
  assert.match(businessQuery, /APPROVED/);
  assert.doesNotMatch(articleQuery, /editorNotes|reviewedBy/);
  assert.doesNotMatch(
    businessQuery,
    /ownerPhone|ownerEmail|documents|adminNotes|aadhaar|uploads/,
  );
  assert(
    sources.every(
      (source) => source.url.startsWith("/") && !source.url.startsWith("//"),
    ),
  );
});

test("origin and persistent usage budgets fail before provider access", async () => {
  await assert.rejects(
    assistantAdmission(
      request({}, "chat", { origin: "https://evil.example" }),
      "chat",
    ),
    { status: 403 },
  );
  const counter = stub(prisma.rateLimit, "upsert", async () => ({
    count: 151,
  }));
  // A per-visitor overflow is denied before the shared counter or retrieval.
  await assert.rejects(assistantAdmission(request({}), "chat"), {
    status: 429,
  });
  assert.equal(counter.mock.callCount(), 1);
});

test("shared hourly budget remains enforced when the per-visitor budget passes", async () => {
  let calls = 0;
  stub(prisma.rateLimit, "upsert", async () => ({
    count: ++calls === 1 ? 1 : 151,
  }));
  await assert.rejects(assistantAdmission(request({}), "chat"), {
    status: 429,
  });
  assert.equal(calls, 2);
});

test("provider requests use only server credentials and sanitize upstream failures", async () => {
  let endpoint = "",
    authorization = "";
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    endpoint = String(url);
    authorization = new Headers(init.headers).get("authorization") || "";
    return new Response(
      JSON.stringify({ error: { message: "private-provider-detail" } }),
      { status: 401 },
    );
  });
  await assert.rejects(
    openaiRequest("responses", "{}", new AbortController().signal),
    (error) => {
      assert.equal((error as { status: number }).status, 502);
      assert.doesNotMatch(
        (error as Error).message,
        /private-provider-detail|unit-test-only-key/,
      );
      return true;
    },
  );
  assert.equal(endpoint, "https://api.openai.com/v1/responses");
  assert.equal(authorization, "Bearer unit-test-only-key");
  process.env.OPENAI_API_KEY = "";
  assert.throws(() => assistantConfig(), { status: 503 });
});

test("chat integrates configured model, nonstored responses, allowlisted sources and signed voice", async () => {
  knowledgeStub();
  let payload: Record<string, unknown> = {};
  mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    payload = JSON.parse(String(init.body));
    return Response.json({
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                answer: "Create an account, then register your business.",
                sourceIds: ["H1"],
              }),
            },
          ],
        },
      ],
    });
  });
  const response = await chat(
    request({ message: "How can I register?", language: "en" }),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.sources[0].url, "/register-business");
  verifySpeech(data.answer, "en", data.speechToken);
  assert.equal(payload.model, "unit-test-configured-model");
  assert.equal(payload.store, false);
  assert.doesNotMatch(
    JSON.stringify(data),
    /unit-test-only-key|PUBLIC KNOWLEDGE/,
  );
});

test("unknown provider citations and incomplete answers are rejected instead of simulated success", async () => {
  knowledgeStub();
  for (const reply of [
    { status: "incomplete", output: [] },
    {
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                answer: "fabricated",
                sourceIds: ["https://evil.example"],
              }),
            },
          ],
        },
      ],
    },
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json(reply));
    assert.equal(
      (await chat(request({ message: "help", language: "en" }))).status,
      502,
    );
  }
});

test("provider citation collections accept the boundary and reject oversized answers", async () => {
  knowledgeStub();
  let sourceCount = 20;
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                answer: "Create an account, then register your business.",
                sourceIds: Array(sourceCount).fill("H1"),
              }),
            },
          ],
        },
      ],
    }),
  );
  const accepted = await chat(
    request({ message: "How can I register?", language: "en" }),
  );
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).sources[0].url, "/register-business");
  for (sourceCount of [21, 1000]) {
    const rejected = await chat(
      request({ message: "How can I register?", language: "en" }),
    );
    assert.equal(rejected.status, 502);
    assert.match((await rejected.json()).error, /could not verify its sources/);
  }
});

test("speech cannot narrate arbitrary client text and transcription rejects invalid audio before provider calls", async () => {
  const provider = mock.method(globalThis, "fetch", async () => {
    throw new Error("must not call provider");
  });
  const token = signSpeech("approved", "en");
  assert.equal(
    (
      await speech(
        request({ text: "changed", language: "en", token }, "speech"),
      )
    ).status,
    403,
  );
  const audio = new Request(`${origin}/api/assistant/transcribe?language=en`, {
    method: "POST",
    headers: { origin, "Content-Type": "audio/wav" },
    body: "not audio",
  });
  assert.equal((await transcribe(audio)).status, 415);
  assert.equal(provider.mock.callCount(), 0);
});
