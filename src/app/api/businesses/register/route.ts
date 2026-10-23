import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireOwnedUpload } from "@/lib/uploads";
import { generateRefNumber } from "@/lib/utils";
import { businessSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { invalidatePublicData } from "@/lib/public-cache";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    await rateLimit(request, `business:${session.userId}`);
    const body = await readJson(request, businessSchema);
    const { id, refNumber, isDraft, hasFactory, ...fields } = body;
    const existing =
      id || refNumber
        ? await prisma.businessProfile.findFirst({
            where: id ? { id } : { refNumber: refNumber || undefined },
          })
        : null;
    if ((id || refNumber) && !existing)
      throw new HttpError(404, "Business not found.");
    if (
      existing &&
      session.userId !== existing.userId &&
      session.role !== "ADMIN"
    )
      throw new HttpError(403, "You cannot edit this business.");
    const category = await prisma.businessCategory.findUnique({
      where: { id: fields.categoryId },
    });
    if (!category?.isActive)
      throw new HttpError(400, "Choose an active business category.");
    await requireOwnedUpload(fields.logoUrl, session.userId, "image");
    await requireOwnedUpload(fields.documentUrl, session.userId);
    const data = {
      ...fields,
      ownerName: fields.ownerName || "",
      ownerPhone: fields.ownerPhone || "",
      businessName: fields.businessName || "",
      productsServices: fields.productsServices || "",
      officeAddress: fields.officeAddress || "",
      officeCity: fields.officeCity || "",
      officeTaluka: fields.officeTaluka || "",
      officeDistrict: fields.officeDistrict || "",
      officePincode: fields.officePincode || "",
      establishedYear: fields.establishedYear ?? null,
      areaSqm: fields.areaSqm ?? null,
      employeeCountFemale: fields.employeeCountFemale ?? 0,
      employeeCountMale: fields.employeeCountMale ?? 0,
      employeeCountTotal:
        (fields.employeeCountFemale ?? 0) + (fields.employeeCountMale ?? 0),
      logoUrl: fields.logoUrl || null,
      documentUrl: fields.documentUrl || null,
      ...(hasFactory === false
        ? {
            factoryAddress: null,
            factoryCity: null,
            factoryTaluka: null,
            factoryDistrict: null,
            factoryPincode: null,
          }
        : {}),
      status: isDraft ? "DRAFT" : "PENDING",
      publishedAt: null,
      rejectionReason: null,
    };
    const translatedFields = [
      "ownerName",
      "businessName",
      "subCategory",
      "productsServices",
      "description",
      "officeAddress",
      "officeCity",
      "officeTaluka",
      "officeDistrict",
    ] as const;
    const resetTranslations = existing
      ? Object.fromEntries(
          translatedFields
            .filter(
              (key) =>
                fields[key] !== undefined && fields[key] !== existing[key],
            )
            .map((key) => [`${key}En`, null]),
        )
      : {};
    const saved = await prisma.$transaction(async (tx) => {
      const profile = existing
        ? await tx.businessProfile.update({
            where: { id: existing.id },
            data: { ...data, ...resetTranslations },
          })
        : await tx.businessProfile.create({
            data: {
              ...data,
              userId: session.userId,
              refNumber: generateRefNumber(),
            },
          });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          action: isDraft
            ? "BUSINESS_DRAFT_SAVED"
            : "BUSINESS_SUBMITTED_FOR_REVIEW",
          entityType: "BusinessProfile",
          entityId: profile.id,
        },
      });
      return profile;
    });
    invalidatePublicData("businesses");
    return NextResponse.json({
      success: true,
      profileId: saved.id,
      refNumber: saved.refNumber,
      status: saved.status,
    });
  } catch (error) {
    return apiError(error);
  }
}
