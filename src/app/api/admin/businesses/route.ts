import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAuth(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const businesses = await prisma.businessProfile.findMany({
      where,
      include: {
        category: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    return apiError(error);
  }
}
