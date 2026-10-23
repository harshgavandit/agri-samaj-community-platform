import { publicBusiness, publicBusinessSelect } from "@/lib/business";
import { getPublicDirectoryFirstPage } from "@/lib/public-data";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
    const sort = searchParams.get("sort") || "recent";
    if (
      !["recent", "name", "oldest"].includes(sort) ||
      category.length > 100 ||
      (classification &&
        ![
          "MANUFACTURER",
          "TRADER",
          "CONTRACTOR",
          "PROFESSIONAL",
          "OTHER",
        ].includes(classification))
    )
      throw new HttpError(400, "Invalid directory filter.");
    const skip = (page - 1) * limit;

    if (
      !q &&
      !category &&
      !district &&
      !classification &&
      page === 1 &&
      sort === "recent"
    ) {
      const snapshot = await getPublicDirectoryFirstPage();
      return NextResponse.json({
        businesses: snapshot.businesses.slice(0, limit),
        pagination: {
          page,
          limit,
          total: snapshot.total,
          totalPages: Math.ceil(snapshot.total / limit),
        },
      });
    }

    const andConditions: Prisma.BusinessProfileWhereInput[] = [
      { status: "APPROVED" },
    ];

    if (category) {
      andConditions.push({
        OR: [{ categoryId: category }, { category: { slug: category } }],
      });
    }

    if (district) {
      andConditions.push({
        OR: [
          { officeDistrict: { contains: district, mode: "insensitive" } },
          { officeDistrictEn: { contains: district, mode: "insensitive" } },
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
          { businessName: { contains: q, mode: "insensitive" } },
          { businessNameEn: { contains: q, mode: "insensitive" } },
          { brandName: { contains: q, mode: "insensitive" } },
          { productsServices: { contains: q, mode: "insensitive" } },
          { productsServicesEn: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { ownerName: { contains: q, mode: "insensitive" } },
          { ownerNameEn: { contains: q, mode: "insensitive" } },
          { officeCity: { contains: q, mode: "insensitive" } },
          { officeCityEn: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: andConditions };

    const [total, businesses] = await Promise.all([
      prisma.businessProfile.count({ where }),
      prisma.businessProfile.findMany({
        where,
        select: publicBusinessSelect,
        orderBy:
          sort === "name"
            ? [{ businessName: "asc" }, { id: "asc" }]
            : [
                { createdAt: sort === "oldest" ? "asc" : "desc" },
                { id: "asc" },
              ],
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
