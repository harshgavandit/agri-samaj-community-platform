import { requireAuth } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { censusSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth(["ADMIN", "ENUMERATOR"]);

    // Check if census module is enabled in env
    const isModuleEnabled =
      (process.env.ENABLE_SURVEY_MODULE ??
        process.env.NEXT_PUBLIC_ENABLE_SURVEY_MODULE) === "true";

    if (!isModuleEnabled)
      return NextResponse.json({ isModuleEnabled: false, records: [] });
    const records = await prisma.censusTracker.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      isModuleEnabled,
      records,
      notice:
        "Restricted community census tracking records. Aggregated tally only.",
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(["ADMIN", "ENUMERATOR"]);
    await rateLimit(request, "admin/census", 60);
    if (
      (process.env.ENABLE_SURVEY_MODULE ??
        process.env.NEXT_PUBLIC_ENABLE_SURVEY_MODULE) !== "true"
    )
      throw new HttpError(403, "Census module is disabled.");
    const body = await readJson(request, censusSchema);

    const {
      enumeratorNo,
      surveyorName,
      divisionName,
      taluka,
      district,
      pincode,
      totalHouses,
      agriHouses,
      questionnairesReceivedFrom,
      questionnairesReceivedTo,
      questionnairesUsed,
      questionnairesBlank,
      questionnairesDamaged,
      notes,
    } = body;

    const total = totalHouses || 0;
    const agri = agriHouses || 0;
    const percentage = total > 0 ? (agri / total) * 100 : 0;

    const newRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.censusTracker.create({
        data: {
          enumeratorNo: enumeratorNo || "EN-001",
          surveyorName: surveyorName || user.name,
          divisionName: divisionName || "Panvel",
          taluka: taluka || "Panvel",
          district: district || "Raigad",
          pincode: pincode || "410206",
          totalHouses: total,
          agriHouses: agri,
          agriPercentage: parseFloat(percentage.toFixed(1)),
          questionnairesReceivedFrom: questionnairesReceivedFrom ?? null,
          questionnairesReceivedTo: questionnairesReceivedTo ?? null,
          questionnairesUsed: questionnairesUsed ?? null,
          questionnairesBlank: questionnairesBlank ?? null,
          questionnairesDamaged: questionnairesDamaged ?? null,
          status: "SUBMITTED",
          notes: notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CENSUS_CREATED",
          entityType: "CensusTracker",
          entityId: record.id,
        },
      });
      return record;
    });
    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    return apiError(error);
  }
}
