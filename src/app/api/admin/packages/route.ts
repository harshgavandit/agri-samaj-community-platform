import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { invalidatePublicData } from "@/lib/public-cache";
import { text, optionalText } from "@/lib/validation";
const schema = z.object({
  id: optionalText(100),
  code: text(60).regex(/^[A-Z0-9_-]+$/),
  nameMr: text(),
  nameEn: text(),
  placementType: z.enum([
    "COVER_BACK",
    "COVER_INNER_FRONT",
    "COVER_INNER_BACK",
    "WELCOME_PAGE",
    "FULL_PAGE",
    "HALF_PAGE",
    "QUARTER_PAGE",
    "EIGHTH_PAGE",
    "DIGITAL_BANNER",
  ]),
  colorType: z.enum(["COLOR", "MONOCHROME"]),
  price: z.coerce.number().finite().positive().max(10000000).multipleOf(0.01),
  dimensions: text(100),
  isActive: z.boolean(),
});
export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    return NextResponse.json({
      records: await prisma.advertisementPackage.findMany({
        orderBy: { order: "asc" },
      }),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/packages", 60);
    const { id, ...data } = await readJson(request, schema);
    const record = await prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.advertisementPackage.update({ where: { id }, data })
        : await tx.advertisementPackage.create({ data });
      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: "PACKAGE_SAVED",
          entityType: "AdvertisementPackage",
          entityId: saved.id,
        },
      });
      return saved;
    });
    invalidatePublicData("packages");
    return NextResponse.json({ record });
  } catch (e) {
    return apiError(e);
  }
}
