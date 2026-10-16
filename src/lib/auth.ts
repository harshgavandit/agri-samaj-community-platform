import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { HttpError } from "./http";
import { prisma } from "./prisma";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    /your-secure|change.?this|agri_samaj_secure_jwt/i.test(secret)
  )
    throw new HttpError(
      503,
      "Authentication is not configured. Contact the administrator.",
    );
  return secret;
}
const COOKIE_NAME = "agri_samaj_session";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER" | "ENUMERATOR";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: "7d",
    algorithm: "HS256",
    issuer: "agri-samaj",
    audience: "agri-samaj-web",
  });
}

export function verifyToken(token: string): UserSession | null {
  try {
    const payload = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: "agri-samaj",
      audience: "agri-samaj-web",
    });
    if (typeof payload === "string" || typeof payload.userId !== "string")
      return null;
    return payload as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user?.isActive || !["MEMBER", "ADMIN", "ENUMERATOR"].includes(user.role))
    return null;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserSession["role"],
  };
}

export async function requireAuth(roles?: string[]): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (roles && !roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden: Insufficient privileges");
  }
  return user;
}
