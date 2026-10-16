import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.businessCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            businesses: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return apiError(error);
  }
}
