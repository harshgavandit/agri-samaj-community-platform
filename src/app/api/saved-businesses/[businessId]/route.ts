import { requireAuth } from "@/lib/auth";
import { apiError, rateLimit } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { saveBusiness } from "@/lib/saved-businesses";
import { NextResponse } from "next/server";
import { z } from "zod";

type Context = { params: Promise<{ businessId: string }> };
const identifier = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireAuth();
    await rateLimit(request, `shortlist:${user.userId}`, 40);
    const businessId = identifier.parse((await context.params).businessId);
    await saveBusiness(user.userId, businessId);
    return NextResponse.json({ saved: true, businessId });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireAuth();
    await rateLimit(request, `shortlist:${user.userId}`, 40);
    const businessId = identifier.parse((await context.params).businessId);
    await prisma.savedBusiness.deleteMany({
      where: { userId: user.userId, businessProfileId: businessId },
    });
    return NextResponse.json({ saved: false, businessId });
  } catch (error) {
    return apiError(error);
  }
}
