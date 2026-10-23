import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { readPagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    await requireAuth(["ADMIN"]);
    const params = new URL(request.url).searchParams;
    const { page, limit, skip } = readPagination(params);
    const status = params.get("status") || "ALL";
    const query = params.get("q")?.trim() || "";
    if (
      !["ALL", "NEW", "IN_PROGRESS", "RESOLVED"].includes(status) ||
      query.length > 200
    )
      throw new HttpError(400, "Invalid inquiry filter.");
    const where: Prisma.ContactInquiryWhereInput = {
      ...(status !== "ALL" ? { status } : {}),
      ...(query
        ? {
            OR: ["name", "email", "subject", "message"].map((field) => ({
              [field]: { contains: query, mode: "insensitive" },
            })),
          }
        : {}),
    };
    const [total, inquiries] = await Promise.all([
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
    ]);
    return NextResponse.json({
      inquiries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
