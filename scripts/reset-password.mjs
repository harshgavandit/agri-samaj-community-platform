import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
loadEnvConfig(process.cwd());
const email = process.env.RESET_EMAIL?.trim().toLowerCase();
const password = process.env.RESET_PASSWORD;
if (
  !email ||
  !password ||
  password.length < 12 ||
  Buffer.byteLength(password) > 72 ||
  /change.?this|agrisamaj2026/i.test(password)
)
  throw new Error(
    "Provide RESET_EMAIL and a unique RESET_PASSWORD of 12-72 bytes through the environment.",
  );
const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { email },
      data: { passwordHash },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "OPERATOR_PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
      },
    });
  });
  console.log("Password updated.");
} finally {
  await db.$disconnect();
}
