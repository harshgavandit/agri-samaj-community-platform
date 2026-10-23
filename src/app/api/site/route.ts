import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { getPublicSiteSettings } from "@/lib/public-data";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({
      settings: await getPublicSiteSettings(),
    });
  } catch (error) {
    return apiError(error);
  }
}
