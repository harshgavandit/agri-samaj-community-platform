import { apiError } from "@/lib/http";
import { getPublicPublications } from "@/lib/public-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publications = await getPublicPublications();

    return NextResponse.json({ publications });
  } catch (error) {
    return apiError(error);
  }
}
