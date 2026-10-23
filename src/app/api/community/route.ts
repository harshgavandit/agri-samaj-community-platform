import { apiError } from "@/lib/http";
import type { ContentKind } from "@/lib/community";
import { getPublicContentPage } from "@/lib/public-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const kinds = params.get("kinds") || params.get("kind");
    return NextResponse.json(
      await getPublicContentPage({
        kinds: kinds ? (kinds.split(",") as ContentKind[]) : undefined,
        q: params.get("q") || "",
        page: Number(params.get("page") || 1),
        limit: Number(params.get("limit") || 100),
        period: (params.get("period") || "all") as "all" | "upcoming" | "past",
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
