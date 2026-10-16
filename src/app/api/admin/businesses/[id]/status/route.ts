import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { businessSchema, statusSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    await rateLimit(request, "admin/businesses/[id]/status", 60);
    const body = await readJson(request, statusSchema);
    const { status, rejectionReason, adminNotes } = body;

    const validStatuses = [
      "APPROVED",
      "REJECTED",
      "REVISION_REQUIRED",
      "PENDING",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "APPROVED") {
      const profile = await prisma.businessProfile.findUnique({
        where: { id },
      });
      if (!profile)
        return NextResponse.json(
          { error: "Business not found." },
          { status: 404 },
        );
      const valid = businessSchema.safeParse({ ...profile, isDraft: false });
      if (!valid.success)
        return NextResponse.json(
          {
            error:
              "Only complete applications with accepted terms can be approved.",
          },
          { status: 400 },
        );
    }
    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.businessProfile.update({
        where: { id },
        data: {
          status,
          rejectionReason: rejectionReason || null,
          adminNotes: adminNotes || null,
          publishedAt: status === "APPROVED" ? new Date() : null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          userEmail: admin.email,
          action: `BUSINESS_STATUS_CHANGE_TO_${status}`,
          entityType: "BusinessProfile",
          entityId: id,
          details: `Business profile status updated to ${status}. Notes: ${adminNotes || "None"}`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    return apiError(error);
  }
}
