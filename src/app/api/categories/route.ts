import { apiError } from "@/lib/http";
import { getPublicCategories } from "@/lib/public-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await getPublicCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    return apiError(error);
  }
}
