import { hashPassword, signToken } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await rateLimit(request, "auth/register", 10);
    const body = await readJson(request, registerSchema);
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    signToken({ userId: "configuration-check", email, name, role: "MEMBER" });
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone?.trim() || null,
        role: "MEMBER",
        isActive: true,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as "ADMIN" | "MEMBER" | "ENUMERATOR",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });

    response.cookies.set("agri_samaj_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return apiError(error);
  }
}
