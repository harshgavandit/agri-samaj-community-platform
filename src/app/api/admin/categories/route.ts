import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { invalidatePublicData } from "@/lib/public-cache";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const categories = await prisma.businessCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/categories", 60);
    const body = await readJson(request, categorySchema);
    const {
      id,
      slug,
      nameMr,
      nameEn,
      descriptionMr,
      descriptionEn,
      icon,
      order,
      isActive,
    } = body;

    if (!slug || !nameMr || !nameEn) {
      return NextResponse.json(
        { error: "Slug, Marathi name, and English name are required." },
        { status: 400 },
      );
    }

    const category = await prisma.$transaction(async (tx) => {
      let category;
      if (id) {
        category = await tx.businessCategory.update({
          where: { id },
          data: {
            slug,
            nameMr,
            nameEn,
            descriptionMr: descriptionMr || null,
            descriptionEn: descriptionEn || null,
            icon: icon || null,
            order: order !== undefined ? order : 0,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
          },
        });
      } else {
        category = await tx.businessCategory.create({
          data: {
            slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
            nameMr,
            nameEn,
            descriptionMr: descriptionMr || null,
            descriptionEn: descriptionEn || null,
            icon: icon || "Building",
            order: order !== undefined ? order : 0,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          userEmail: admin.email,
          action: id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
          entityType: "BusinessCategory",
          entityId: category.id,
          details: `Category ${category.nameEn} (${category.slug}) modified by admin`,
        },
      });

      return category;
    });

    invalidatePublicData("categories", "businesses");
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return apiError(error);
  }
}
