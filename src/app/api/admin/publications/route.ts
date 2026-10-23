import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { invalidatePublicData } from "@/lib/public-cache";
import { text, optionalText } from "@/lib/validation";
const schema = z.object({
  id: optionalText(100),
  titleMr: text(),
  titleEn: text(),
  editionYear: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  editionType: z.enum(["DIRECTORY", "MAGAZINE_AGRI_DARPAN", "REPORT", "OTHER"]),
  descriptionMr: optionalText(3000),
  descriptionEn: optionalText(3000),
  pdfUrl: z.union([
    z.literal(""),
    z.literal("/Agri_SAMAJ_PDF.pdf"),
    z
      .string()
      .url()
      .refine(
        (v) => v.startsWith("https://"),
        "Use an approved public HTTPS document URL",
      ),
  ]),
  isPublic: z.boolean(),
});
export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    return NextResponse.json({
      records: await prisma.publication.findMany({
        orderBy: { editionYear: "desc" },
      }),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    await rateLimit(request, "admin/publications", 60);
    const { id, ...data } = await readJson(request, schema);
    const record = await prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.publication.update({ where: { id }, data })
        : await tx.publication.create({ data });
      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: "PUBLICATION_SAVED",
          entityType: "Publication",
          entityId: saved.id,
        },
      });
      return saved;
    });
    invalidatePublicData("publications");
    return NextResponse.json({ record });
  } catch (e) {
    return apiError(e);
  }
}
