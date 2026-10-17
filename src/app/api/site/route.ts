import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { defaultSettings } from "@/lib/community";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({
      settings:
        (await prisma.siteSettings.findUnique({ where: { id: "public" } })) ||
        defaultSettings,
    });
  } catch (error) {
    return apiError(error);
  }
}
