import { getCurrentUser } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new HttpError(404, "File not found.");
    const file = await prisma.upload.findUnique({ where: { id } });
    if (!file) throw new HttpError(404, "File not found.");
    const user = await getCurrentUser();
    const publicLogo =
      file.mimeType.startsWith("image/") &&
      (await prisma.businessProfile.findFirst({
        where: { logoUrl: `/api/files/${id}`, status: "APPROVED" },
        select: { id: true },
      }));
    if (
      !publicLogo &&
      (!user || (user.role !== "ADMIN" && user.userId !== file.userId))
    )
      throw new HttpError(403, "This file is private.");
    let bytes: Buffer;
    try {
      bytes = await readFile(
        path.join(
          process.env.UPLOAD_DIR ||
            path.join(process.cwd(), "storage", "uploads"),
          id,
        ),
      );
    } catch {
      throw new HttpError(404, "File not available.");
    }
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `${file.mimeType === "application/pdf" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
