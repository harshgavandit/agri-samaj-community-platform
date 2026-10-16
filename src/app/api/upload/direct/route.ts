import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new HttpError(503, "Direct uploads are unavailable.");
    await rateLimit(request, `upload:${user.userId}`, 15);
    const input = await readJson(
      request,
      z
        .object({
          name: z.string().trim().min(1).max(200),
          mimeType: z.enum([
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
          ]),
          size: z
            .number()
            .int()
            .min(1)
            .max(5 * 1024 * 1024),
        })
        .strict(),
    );
    const id = randomUUID();
    const pathname = `uploads/${user.userId}/${id}`;
    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname,
      allowedContentTypes: [input.mimeType],
      maximumSizeInBytes: input.size,
      validUntil: Date.now() + 5 * 60_000,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    await prisma.upload.create({
      data: {
        id,
        userId: user.userId,
        name: path.basename(input.name),
        mimeType: input.mimeType,
        size: input.size,
        blobPath: pathname,
        isReady: false,
      },
    });
    return NextResponse.json({ id, pathname, clientToken });
  } catch (error) {
    return apiError(error);
  }
}
