import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readBytes } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { detectMime } from "@/lib/uploads";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";

export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({ direct: !!process.env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    await rateLimit(request, `upload:${user.userId}`, 15);
    const bytes = await readBytes(request, 5 * 1024 * 1024 + 65536);
    let form: FormData;
    try {
      form = await new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": request.headers.get("content-type") || "" },
      }).formData();
    } catch {
      throw new HttpError(400, "Invalid multipart upload.");
    }
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      throw new HttpError(400, "Choose a non-empty file.");
    if (file.size > 5 * 1024 * 1024)
      throw new HttpError(413, "File exceeds the 5 MB limit.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMime(buffer);
    if (!mimeType || mimeType !== file.type)
      throw new HttpError(
        400,
        "Only valid JPG, PNG, WebP or PDF files are accepted.",
      );
    const id = randomUUID();
    const dir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
    const filePath = path.join(dir, id);
    let blobPath: string | undefined;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${user.userId}/${id}`, buffer, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: mimeType,
      });
      blobPath = blob.pathname;
    } else {
      if (process.env.VERCEL)
        throw new HttpError(503, "Private storage is not configured.");
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, buffer, { flag: "wx" });
    }
    try {
      await prisma.upload.create({
        data: {
          id,
          userId: user.userId,
          name: path.basename(file.name).slice(0, 200),
          mimeType,
          size: file.size,
          blobPath,
        },
      });
    } catch (error) {
      if (blobPath) await del(blobPath);
      else await unlink(filePath);
      throw error;
    }
    return NextResponse.json({
      success: true,
      url: `/api/files/${id}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    });
  } catch (error) {
    return apiError(error);
  }
}
