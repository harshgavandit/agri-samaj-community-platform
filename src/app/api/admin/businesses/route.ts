import { requireAuth } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { readPagination } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAuth(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const query = searchParams.get("q")?.trim() || "";
    const { page, limit, skip } = readPagination(searchParams);
    if (
      (status &&
        status !== "ALL" &&
        ![
          "DRAFT",
          "PENDING",
          "APPROVED",
          "REJECTED",
          "REVISION_REQUIRED",
        ].includes(status)) ||
      query.length > 200
    )
      throw new HttpError(400, "Invalid business filter.");

    const where: Prisma.BusinessProfileWhereInput = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (query)
      where.OR = [
        "businessName",
        "businessNameEn",
        "ownerName",
        "ownerNameEn",
        "refNumber",
      ].map((field) => ({ [field]: { contains: query, mode: "insensitive" } }));

    const [total, businesses] = await Promise.all([
      prisma.businessProfile.count({ where }),
      prisma.businessProfile.findMany({
        where,
        include: {
          category: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      businesses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
