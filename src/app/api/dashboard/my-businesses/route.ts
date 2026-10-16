import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireAuth();

    const [businesses, ads] = await Promise.all([
      prisma.businessProfile.findMany({
        where: { userId: session.userId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.advertisementBooking.findMany({
        where: { userId: session.userId },
        include: { package: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      businesses,
      ads,
    });
  } catch (error) {
    return apiError(error);
  }
}
