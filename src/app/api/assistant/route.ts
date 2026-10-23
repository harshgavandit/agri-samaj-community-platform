import { NextResponse } from "next/server";
import { assistantConfig } from "@/lib/assistant-provider";
export const dynamic = "force-dynamic";
export function GET() {
  try {
    assistantConfig();
    return NextResponse.json({ available: true });
  } catch {
    return NextResponse.json({ available: false });
  }
}
