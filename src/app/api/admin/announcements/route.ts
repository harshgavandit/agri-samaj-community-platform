import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { announcementSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/announcements", 60);
    const body = await readJson(request, announcementSchema);
    const {
      id,
      titleMr,
      titleEn,
      slug,
      contentMr,
      contentEn,
      category,
      eventDate,
      location,
      isPublished,
    } = body;

    if (!titleMr || !titleEn || !contentMr) {
      return NextResponse.json(
        { error: "Titles and Marathi content are required." },
        { status: 400 },
      );
    }

    const targetSlug =
      slug ||
      titleEn
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

    const announcement = await prisma.$transaction(async (tx) => {
      let announcement;
      if (id) {
        announcement = await tx.announcement.update({
          where: { id },
          data: {
            titleMr,
            titleEn,
            slug: targetSlug,
            contentMr,
            contentEn: contentEn || contentMr,
            category: category || "INITIATIVE",
            eventDate: eventDate ? new Date(eventDate) : null,
            location: location || null,
            isPublished:
              isPublished !== undefined ? Boolean(isPublished) : true,
          },
        });
      } else {
        announcement = await tx.announcement.create({
          data: {
            titleMr,
            titleEn,
            slug: targetSlug,
            contentMr,
            contentEn: contentEn || contentMr,
            category: category || "INITIATIVE",
            eventDate: eventDate ? new Date(eventDate) : null,
            location: location || null,
            isPublished:
              isPublished !== undefined ? Boolean(isPublished) : true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          userEmail: admin.email,
          action: id ? "ANNOUNCEMENT_UPDATED" : "ANNOUNCEMENT_CREATED",
          entityType: "Announcement",
          entityId: announcement.id,
          details: `Announcement ${announcement.titleEn} modified by admin`,
        },
      });

      return announcement;
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    return apiError(error);
  }
}
