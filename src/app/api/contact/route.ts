import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await rateLimit(request, "contact", 10);
    const body = await readJson(request, contactSchema);
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || "General Inquiry",
        message: message.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      id: inquiry.id,
      message: "Inquiry received. Our office will get back to you shortly.",
    });
  } catch (error) {
    return apiError(error);
  }
}
