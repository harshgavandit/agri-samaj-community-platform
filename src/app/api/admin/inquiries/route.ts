import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ inquiries });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/inquiries", 60);
    const body = await readJson(request, inquirySchema);
    const { id, status, adminNotes } = body;

    if (!id)
      return NextResponse.json(
        { error: "Inquiry ID required" },
        { status: 400 },
      );

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.contactInquiry.update({
        where: { id },
        data: {
          status: status || undefined,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          userEmail: admin.email,
          action: "CONTACT_INQUIRY_STATUS_UPDATED",
          entityType: "ContactInquiry",
          entityId: id,
          details: `Inquiry status changed to ${status}`,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    return apiError(error);
  }
}
