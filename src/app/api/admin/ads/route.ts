import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adStatusSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);

    const bookings = await prisma.advertisementBooking.findMany({
      include: {
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/ads", 60);
    const body = await readJson(request, adStatusSchema);
    const { id, paymentStatus, status, adminRemarks } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.advertisementBooking.update({
        where: { id },
        data: {
          paymentStatus: paymentStatus || undefined,
          ...(paymentStatus === "VERIFIED" ? { paymentDate: new Date() } : {}),
          status: status || undefined,
          adminRemarks: adminRemarks !== undefined ? adminRemarks : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          userEmail: admin.email,
          action: "ADVERTISEMENT_STATUS_UPDATED",
          entityType: "AdvertisementBooking",
          entityId: id,
          details: `Booking ${updated.bookingRef} payment: ${paymentStatus}, status: ${status}`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    return apiError(error);
  }
}
