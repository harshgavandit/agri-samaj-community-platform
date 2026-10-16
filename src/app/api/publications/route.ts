import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publications = await prisma.publication.findMany({
      where: { isPublic: true },
      orderBy: { editionYear: "desc" },
    });

    return NextResponse.json({ publications });
  } catch (error) {
    return apiError(error);
  }
}
