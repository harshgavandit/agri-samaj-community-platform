import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.toLowerCase().startsWith("/uploads/"))
    return new NextResponse(null, { status: 404 });
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expected =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
        ? new URL((process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)!)
            .origin
        : request.nextUrl.origin;
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== expected)
    ) {
      return NextResponse.json(
        { error: "Cross-site requests are not allowed." },
        { status: 403 },
      );
    }
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/api/:path*", "/uploads/:path*"] };
