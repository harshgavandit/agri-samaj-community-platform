import { eventCalendar } from "@/lib/event-calendar";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { siteOrigin } from "@/lib/site";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const language = new URL(request.url).searchParams.get("language") || "mr";
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 140 ||
      !["mr", "en"].includes(language)
    )
      throw new HttpError(400, "Invalid event request.");
    const entry = await prisma.communityContent.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        sourceVerified: true,
        kind: "EVENT",
        eventAt: { not: null },
      },
      select: {
        slug: true,
        titleMr: true,
        titleEn: true,
        summaryMr: true,
        summaryEn: true,
        eventAt: true,
        updatedAt: true,
        location: true,
      },
    });
    if (!entry?.eventAt) throw new HttpError(404, "Published event not found.");
    return new Response(
      eventCalendar(
        { ...entry, eventAt: entry.eventAt },
        language as "mr" | "en",
        siteOrigin(),
      ),
      {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${slug}.ics"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
