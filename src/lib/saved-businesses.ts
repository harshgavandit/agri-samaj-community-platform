import { Prisma } from "@prisma/client";
import { HttpError } from "./http";
import { prisma } from "./prisma";

export const SAVED_BUSINESS_LIMIT = 100;

// Serializable retries preserve the per-member cap even when multiple tabs save
// different businesses concurrently. The composite primary key makes saves unique.
export async function saveBusiness(userId: string, businessProfileId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const business = await transaction.businessProfile.findFirst({
            where: { id: businessProfileId, status: "APPROVED" },
            select: { id: true },
          });
          if (!business)
            throw new HttpError(
              404,
              "This business is not available in the directory.",
            );
          const key = {
            userId_businessProfileId: { userId, businessProfileId },
          };
          const existing = await transaction.savedBusiness.findUnique({
            where: key,
          });
          if (existing) return existing;
          const total = await transaction.savedBusiness.count({
            where: { userId },
          });
          if (total >= SAVED_BUSINESS_LIMIT) {
            throw new HttpError(
              409,
              "Your shortlist is full. Remove a saved business before adding another.",
            );
          }
          return transaction.savedBusiness.create({
            data: { userId, businessProfileId },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if ((error as { code?: string }).code === "P2034") {
        if (attempt < 2) continue;
        throw new HttpError(
          503,
          "Your shortlist is busy. Please try saving this business again.",
        );
      }
      // A parallel identical save is already the requested final state.
      if ((error as { code?: string }).code === "P2002") {
        const existing = await prisma.savedBusiness.findUnique({
          where: { userId_businessProfileId: { userId, businessProfileId } },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }
  throw new HttpError(503, "Please try saving this business again.");
}
