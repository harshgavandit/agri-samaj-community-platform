import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);

    const [
      totalApprovedBusinesses,
      totalPendingBusinesses,
      totalCategories,
      totalAdBookings,
      totalPublications,
      totalUsers,
      totalInquiries,
    ] = await Promise.all([
      prisma.businessProfile.count({ where: { status: "APPROVED" } }),
      prisma.businessProfile.count({ where: { status: "PENDING" } }),
      prisma.businessCategory.count({ where: { isActive: true } }),
      prisma.advertisementBooking.count(),
      prisma.publication.count({ where: { isPublic: true } }),
      prisma.user.count(),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
    ]);

    // Calculate verified ad revenue
    const revenueAgg = await prisma.advertisementBooking.aggregate({
      where: { paymentStatus: "VERIFIED" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      stats: {
        totalApprovedBusinesses,
        totalPendingBusinesses,
        totalCategories,
        totalAdBookings,
        totalPublications,
        totalUsers,
        totalInquiries,
        verifiedRevenue: revenueAgg._sum.amount || 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
