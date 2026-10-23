import { createHash } from "node:crypto";
import { HttpError, rateLimit } from "./http";
import { prisma } from "./prisma";

// Every provider operation first consumes a persistent per-visitor and shared
// budget. No in-memory limit or provider-error fallback can bypass admission.
export async function assistantAdmission(
  request: Request,
  operation: "chat" | "transcribe" | "speech",
) {
  const expected = new URL(
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || request.url,
  ).origin;
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(
      403,
      "Open the assistant from this website to continue.",
    );
  await rateLimit(
    request,
    `assistant:${operation}`,
    operation === "chat" ? 12 : 6,
  );
  const hour = Math.floor(Date.now() / 3600000);
  const key = createHash("sha256")
    .update(`assistant:shared:${hour}`)
    .digest("hex");
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((hour + 1) * 3600000) },
    update: { count: { increment: 1 } },
  });
  const configured = Number(process.env.ASSISTANT_HOURLY_LIMIT || 150);
  const limit =
    Number.isSafeInteger(configured) && configured > 0
      ? Math.min(configured, 1000)
      : 150;
  if (row.count > limit)
    throw new HttpError(
      429,
      "The assistant has reached its hourly usage limit. Please try later or use the contact page.",
    );
}
