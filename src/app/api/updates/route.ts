import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { getPublicUpdatesPage } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return NextResponse.json(
      await getPublicUpdatesPage({
        q: params.get("q") || "",
        period: (params.get("period") || "all") as "all" | "upcoming" | "past",
        page: Number(params.get("page") || 1),
        limit: Number(params.get("limit") || 12),
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
