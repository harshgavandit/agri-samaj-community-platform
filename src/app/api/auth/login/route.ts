import { comparePassword, signToken } from "@/lib/auth";
import { apiError, rateLimit, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

// A fixed work factor keeps unknown and disabled accounts on the same bcrypt
// path as incorrect passwords, without exposing a usable account credential.
const DUMMY_PASSWORD_HASH =
  "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.";

export async function POST(request: Request) {
  try {
    await rateLimit(request, "auth/login", 10);
    const body = await readJson(request, loginSchema);
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (
      /^(Admin|Member)@AgriSamaj2026$/i.test(password) ||
      password === "ChangeThisPassword123!"
    )
      return NextResponse.json(
        {
          error:
            "This account uses a retired default password. Contact the administrator to reset it.",
        },
        { status: 403 },
      );
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });

    const isValid = await comparePassword(
      password,
      user?.passwordHash || DUMMY_PASSWORD_HASH,
    );
    if (
      !user?.isActive ||
      !isValid ||
      !["ADMIN", "MEMBER", "ENUMERATOR"].includes(user.role)
    ) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "MEMBER" | "ENUMERATOR",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set("agri_samaj_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return apiError(error);
  }
}
