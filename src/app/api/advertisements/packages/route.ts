import { apiError } from "@/lib/http";
import { getPublicPackages } from "@/lib/public-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const packages = await getPublicPackages();

    return NextResponse.json({ packages });
  } catch (error) {
    return apiError(error);
  }
}
