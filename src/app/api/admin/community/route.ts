import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { communitySchema } from "@/lib/community-validation";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { invalidatePublicData } from "@/lib/public-cache";
export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    return NextResponse.json({
      entries: await prisma.communityContent.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/community", 60);
    const { id, revision, ...input } = await readJson(request, communitySchema);
    if (input.coverImageUrl) {
      const file = await prisma.upload.findUnique({
        where: { id: input.coverImageUrl.split("/").pop() },
        include: { user: { select: { role: true } } },
      });
      if (
        !file?.isReady ||
        !file.mimeType.startsWith("image/") ||
        file.user.role !== "ADMIN"
      )
        throw new HttpError(
          400,
          "Choose a ready image uploaded by an administrator.",
        );
    }
    const data = {
      ...input,
      coverImageUrl: input.coverImageUrl || null,
      coverCredit: input.coverCredit || null,
      actionUrl: input.actionUrl || null,
      eventAt: input.eventAt ? new Date(input.eventAt) : null,
      location: input.location || null,
      verifiedAt: input.sourceVerified ? new Date() : null,
      reviewedBy: input.sourceVerified ? admin.userId : null,
    };
    const entry = await prisma.$transaction(async (tx) => {
      if (id) {
        if (!revision)
          throw new HttpError(400, "A revision is required for edits.");
        const changed = await tx.communityContent.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } },
        });
        if (!changed.count)
          throw new HttpError(
            409,
            "This entry changed. Reload it before saving your edits.",
          );
      }
      const saved = id
        ? await tx.communityContent.findUniqueOrThrow({ where: { id } })
        : await tx.communityContent.create({ data });
      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: id ? "CONTENT_UPDATED" : "CONTENT_CREATED",
          entityType: "CommunityContent",
          entityId: saved.id,
          details: `Status: ${saved.status}; revision: ${saved.revision}`,
        },
      });
      return saved;
    });
    invalidatePublicData("community");
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return apiError(error);
  }
}
