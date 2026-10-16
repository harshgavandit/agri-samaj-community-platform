import { publicBusiness } from "@/lib/business";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category") || "";
    const district = searchParams.get("district") || "";
    const classification = searchParams.get("classification") || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "12");
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 50 ||
      q.length > 200 ||
      district.length > 100
    )
      throw new HttpError(400, "Invalid search or pagination.");
    const skip = (page - 1) * limit;

    const andConditions: any[] = [{ status: "APPROVED" }];

    if (category) {
      andConditions.push({
        OR: [{ categoryId: category }, { category: { slug: category } }],
      });
    }

    if (district) {
      andConditions.push({
        OR: [
          { officeDistrict: { contains: district } },
          { officeDistrictEn: { contains: district } },
        ],
      });
    }

    if (classification) {
      andConditions.push({
        businessClassification: classification,
      });
    }

    if (q) {
      andConditions.push({
        OR: [
          { businessName: { contains: q } },
          { businessNameEn: { contains: q } },
          { brandName: { contains: q } },
          { productsServices: { contains: q } },
          { productsServicesEn: { contains: q } },
          { description: { contains: q } },
          { descriptionEn: { contains: q } },
          { ownerName: { contains: q } },
          { ownerNameEn: { contains: q } },
          { officeCity: { contains: q } },
          { officeCityEn: { contains: q } },
        ],
      });
    }

    const where = { AND: andConditions };

    const [total, businesses] = await Promise.all([
      prisma.businessProfile.count({ where }),
      prisma.businessProfile.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              slug: true,
              nameMr: true,
              nameEn: true,
              icon: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      businesses: businesses.map(publicBusiness),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
