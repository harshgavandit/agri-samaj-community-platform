import { getCurrentUser } from "@/lib/auth";
import { publicBusiness, publicBusinessSelect } from "@/lib/business";
import { apiError, HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id || id.length > 100)
      throw new HttpError(400, "Invalid business reference.");
    const session = await getCurrentUser();

    // Anonymous visitors only retrieve public columns. Signed-in owners and
    // administrators still receive their existing editable profile shape below.
    if (!session) {
      const published = await prisma.businessProfile.findFirst({
        where: { OR: [{ id }, { refNumber: id }] },
        select: publicBusinessSelect,
      });
      if (!published)
        return NextResponse.json(
          { error: "Business profile not found" },
          { status: 404 },
        );
      if (published.status !== "APPROVED")
        return NextResponse.json(
          {
            error:
              "Profile is undergoing verification and is not yet publicly visible",
          },
          { status: 403 },
        );
      return NextResponse.json({ business: publicBusiness(published) });
    }

    const business = await prisma.businessProfile.findFirst({
      where: {
        OR: [{ id }, { refNumber: id }],
      },
      include: {
        category: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // If not approved, only owner or admin can view
    const isOwner = session && session.userId === business.userId;
    const isAdmin = session && session.role === "ADMIN";

    if (business.status !== "APPROVED" && !isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Profile is undergoing verification and is not yet publicly visible",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      business: isOwner || isAdmin ? business : publicBusiness(business),
    });
  } catch (error) {
    return apiError(error);
  }
}
