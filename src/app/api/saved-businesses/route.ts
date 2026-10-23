import { requireAuth } from "@/lib/auth";
import { publicBusiness, publicBusinessSelect } from "@/lib/business";
import { apiError, HttpError, rateLimit } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { SAVED_BUSINESS_LIMIT } from "@/lib/saved-businesses";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const view = new URL(request.url).searchParams.get("view");
    if (view && view !== "ids")
      throw new HttpError(400, "Invalid shortlist view.");
    const where = {
      userId: user.userId,
      businessProfile: { status: "APPROVED" },
    };
    const unavailableCount = await prisma.savedBusiness.count({
      where: {
        userId: user.userId,
        businessProfile: { status: { not: "APPROVED" } },
      },
    });
    if (view === "ids") {
      const saved = await prisma.savedBusiness.findMany({
        where,
        select: { businessProfileId: true },
        orderBy: [{ createdAt: "desc" }, { businessProfileId: "asc" }],
        take: SAVED_BUSINESS_LIMIT,
      });
      return NextResponse.json({
        savedIds: saved.map((item) => item.businessProfileId),
        limit: SAVED_BUSINESS_LIMIT,
        unavailableCount,
      });
    }
    const saved = await prisma.savedBusiness.findMany({
      where,
      select: { businessProfile: { select: publicBusinessSelect } },
      orderBy: [{ createdAt: "desc" }, { businessProfileId: "asc" }],
      take: SAVED_BUSINESS_LIMIT,
    });
    return NextResponse.json({
      businesses: saved.map((item) => publicBusiness(item.businessProfile)),
      savedIds: saved.map((item) => item.businessProfile.id),
      limit: SAVED_BUSINESS_LIMIT,
      unavailableCount,
    });
  } catch (error) {
    return apiError(error);
  }
}

// Members explicitly choose this recovery action. Withdrawn listing identities
// stay private and previously saved rows are never silently discarded.
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    await rateLimit(request, `shortlist:${user.userId}`, 40);
    const removed = await prisma.savedBusiness.deleteMany({
      where: {
        userId: user.userId,
        businessProfile: { status: { not: "APPROVED" } },
      },
    });
    return NextResponse.json({ removed: removed.count });
  } catch (error) {
    return apiError(error);
  }
}
