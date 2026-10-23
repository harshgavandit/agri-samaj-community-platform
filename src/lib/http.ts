import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import { prisma } from "./prisma";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        ...(error.status === 429
          ? { headers: { "Retry-After": String(error.retryAfter || 60) } }
          : {}),
      },
    );
  if (error instanceof z.ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  const code = (error as { code?: string })?.code;
  if (code === "P2002")
    return NextResponse.json(
      { error: "A record with these details already exists." },
      { status: 409 },
    );
  if (code === "P2025")
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  return NextResponse.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}

export async function readBytes(request: Request, max = 128 * 1024) {
  if (Number(request.headers.get("content-length")) > max)
    throw new HttpError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > max) {
        await reader.cancel().catch(() => undefined);
        throw new HttpError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export async function readJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase() !== "application/json"
  )
    throw new HttpError(415, "Use application/json.");
  let body: unknown;
  try {
    body = JSON.parse((await readBytes(request)).toString("utf8"));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Invalid JSON body.");
  }
  return schema.parse(body);
}

// Vercel overwrites x-forwarded-for at its ingress. Other deployments must
// explicitly opt in and ensure their trusted proxy also overwrites this header.
export function clientAddress(request: Request) {
  if (process.env.VERCEL !== "1" && process.env.TRUST_PROXY !== "true")
    return "anonymous";
  const candidate = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    .trim();
  return candidate && isIP(candidate) ? candidate.toLowerCase() : "anonymous";
}

let lastCleanupAt = 0;

// Persistent admission shared by processes using the same database.
export async function rateLimit(
  request: Request,
  scope: string,
  limit = 30,
  windowMs = 60_000,
) {
  const now = Date.now();
  const ip = clientAddress(request);
  const window = Math.floor(now / windowMs);
  const key = createHash("sha256")
    .update(`${scope}:${ip}:${window}`)
    .digest("hex");
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((window + 1) * windowMs) },
    update: { count: { increment: 1 } },
  });
  if (row.count > limit)
    throw new HttpError(
      429,
      "Too many requests. Please try again shortly.",
      Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000)),
    );
  // Cleanup is maintenance, never an authorization bypass. Limit DELETE work
  // per process and keep accepted requests working if cleanup itself fails.
  if (now - lastCleanupAt > 60_000) {
    lastCleanupAt = now;
    await prisma.rateLimit
      .deleteMany({
        where: { expiresAt: { lt: new Date(now) } },
      })
      .catch(() => undefined);
  }
}
