import { getCurrentUser } from "@/lib/auth";
import { apiError, HttpError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireOwnedUpload } from "@/lib/uploads";
import { generateRefNumber } from "@/lib/utils";
import { bookingSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await rateLimit(request, "advertisements/book", 60);
    const body = await readJson(request, bookingSchema);
    const session = await getCurrentUser();

    const {
      packageId,
      businessProfileId,
      advertiserName,
      businessName,
      contactPerson,
      phone,
      email,
      address,
      adTextContent,
      artworkUrl,
      paymentMethod,
      paymentReference,
    } = body;

    if (!packageId || !advertiserName || !phone || !email || !adTextContent) {
      return NextResponse.json(
        {
          error:
            "Package, advertiser name, phone, email and advertisement copy are required.",
        },
        { status: 400 },
      );
    }

    const adPackage = await prisma.advertisementPackage.findUnique({
      where: { id: packageId },
    });

    if (!adPackage || !adPackage.isActive || adPackage.price <= 0) {
      return NextResponse.json(
        { error: "Selected advertisement package not found." },
        { status: 404 },
      );
    }

    if (businessProfileId) {
      const owned =
        session &&
        (await prisma.businessProfile.findFirst({
          where: { id: businessProfileId, userId: session.userId },
        }));
      if (!owned)
        throw new HttpError(403, "You cannot book for this business.");
    }
    if (artworkUrl) {
      if (!session)
        throw new HttpError(401, "Sign in before uploading artwork.");
      await requireOwnedUpload(artworkUrl, session.userId);
    }
    const bookingRef = generateRefNumber("AASP-ADV");

    const booking = await prisma.$transaction(async (tx) => {
      const booking = await tx.advertisementBooking.create({
        data: {
          bookingRef,
          userId: session?.userId || null,
          businessProfileId: businessProfileId || null,
          packageId,
          advertiserName: advertiserName.trim(),
          businessName: (businessName || advertiserName).trim(),
          contactPerson: (contactPerson || advertiserName).trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          address: address?.trim() || "",
          adTextContent: adTextContent.trim(),
          artworkUrl: artworkUrl || null,
          amount: adPackage.price,
          paymentStatus: "PENDING",
          paymentMethod: paymentMethod || "NEFT_RTGS",
          paymentReference: paymentReference?.trim() || null,
          paymentDate: null,
          status: "PENDING",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session?.userId || null,
          userEmail: session?.email || email,
          action: "ADVERTISEMENT_BOOKED",
          entityType: "AdvertisementBooking",
          entityId: booking.id,
          details: `Booking ${bookingRef} placed for package ${adPackage.nameEn} (INR ${adPackage.price})`,
        },
      });

      return booking;
    });

    return NextResponse.json({
      success: true,
      bookingRef,
      bookingId: booking.id,
      amount: adPackage.price,
      message:
        "Advertisement booking received successfully! Our representative will verify proof and confirm publication.",
    });
  } catch (error) {
    return apiError(error);
  }
}
