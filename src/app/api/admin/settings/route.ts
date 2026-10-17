import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { defaultSettings } from "@/lib/community";
import { settingsSchema } from "@/lib/community-validation";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    return NextResponse.json({
      settings:
        (await prisma.siteSettings.findUnique({ where: { id: "public" } })) ||
        defaultSettings,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/settings", 30);
    const { revision, ...data } = await readJson(request, settingsSchema);
    const settings = await prisma.$transaction(async (tx) => {
      const changed = await tx.siteSettings.updateMany({
        where: { id: "public", revision },
        data: { ...data, revision: { increment: 1 } },
      });
      if (!changed.count)
        throw new HttpError(409, "Settings changed. Reload before saving.");
      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: "SITE_SETTINGS_UPDATED",
          entityType: "SiteSettings",
          entityId: "public",
        },
      });
      return tx.siteSettings.findUniqueOrThrow({ where: { id: "public" } });
    });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return apiError(error);
  }
}
