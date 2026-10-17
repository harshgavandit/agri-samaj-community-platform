import { publicContent } from "@/lib/community-validation";
import { apiError, HttpError } from "@/lib/http";
import { contentKinds, defaultSettings } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind"),
      query = params.get("q")?.trim() || "";
    if (
      query.length > 200 ||
      (kind && !contentKinds.includes(kind as (typeof contentKinds)[number]))
    )
      throw new HttpError(400, "Invalid content filter.");
    const where: Prisma.CommunityContentWhereInput = {
      status: "PUBLISHED",
      sourceVerified: true,
      ...(kind ? { kind } : {}),
      ...(query
        ? {
            OR: ["titleMr", "titleEn", "summaryMr", "summaryEn"].map(
              (field) => ({
                [field]: { contains: query, mode: "insensitive" },
              }),
            ),
          }
        : {}),
    };
    const [entries, settings] = await Promise.all([
      prisma.communityContent.findMany({
        where,
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        take: 100,
      }),
      prisma.siteSettings.findUnique({ where: { id: "public" } }),
    ]);
    return NextResponse.json({
      entries: entries.map((entry) => publicContent(entry, false)),
      settings: settings || defaultSettings,
    });
  } catch (error) {
    return apiError(error);
  }
}
