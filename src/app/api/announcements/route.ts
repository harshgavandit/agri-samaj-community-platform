import { apiError } from "@/lib/http";
import { getPublicAnnouncementsPage } from "@/lib/public-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return NextResponse.json(
      await getPublicAnnouncementsPage({
        q: params.get("q") || "",
        period: (params.get("period") || "all") as "all" | "upcoming" | "past",
        page: Number(params.get("page") || 1),
        limit: Number(params.get("limit") || 100),
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
