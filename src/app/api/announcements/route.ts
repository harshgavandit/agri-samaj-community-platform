import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    return apiError(error);
  }
}
