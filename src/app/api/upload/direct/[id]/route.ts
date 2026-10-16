import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readBytes } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { detectMime } from "@/lib/uploads";
import { get, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const id = z
      .string()
      .uuid()
      .parse((await params).id);
    await rateLimit(request, `upload-finalize:${user.userId}`, 30);
    const file = await prisma.upload.findUnique({ where: { id } });
    if (!file || file.userId !== user.userId || !file.blobPath)
      throw new HttpError(404, "Upload not found.");
    if (!file.isReady) {
      if (Date.now() - file.createdAt.getTime() > 10 * 60_000)
        throw new HttpError(
          410,
          "Upload expired. Please choose the file again.",
        );
      const result = await get(file.blobPath, {
        access: "private",
        useCache: false,
      });
      if (!result || result.statusCode !== 200)
        throw new HttpError(409, "Upload has not completed.");
      const bytes = await readBytes(
        new Request("http://upload.internal", {
          method: "POST",
          body: result.stream,
          duplex: "half",
        } as RequestInit),
        5 * 1024 * 1024,
      );
      if (bytes.length !== file.size || detectMime(bytes) !== file.mimeType) {
        await del(file.blobPath);
        await prisma.upload.delete({ where: { id } });
        throw new HttpError(
          400,
          "The uploaded file does not match its declared size or type.",
        );
      }
      await prisma.upload.update({ where: { id }, data: { isReady: true } });
    }
    return NextResponse.json({ success: true, url: `/api/files/${id}` });
  } catch (error) {
    return apiError(error);
  }
}
