import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await Promise.all([
      prisma.rateLimit.findFirst({ select: { key: true } }),
      prisma.communityContent.findFirst({ select: { id: true } }),
      prisma.siteSettings.findFirst({ select: { id: true } }),
    ]);
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
