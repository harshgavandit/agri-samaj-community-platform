import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import path from "node:path";
loadEnvConfig(process.cwd());
const secret = process.env.JWT_SECRET;
if (
  !secret ||
  secret.length < 32 ||
  /your-secure|change.?this|agri_samaj_secure_jwt/i.test(secret)
)
  throw new Error(
    "Set JWT_SECRET to a unique cryptographically random value of at least 32 characters.",
  );
if (!process.env.DATABASE_URL?.startsWith("file:"))
  throw new Error("This Prisma schema requires a SQLite file: DATABASE_URL.");
const url = new URL(
  process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
);
if (!["http:", "https:"].includes(url.protocol))
  throw new Error("APP_URL must use HTTP or HTTPS.");
if (
  process.env.NODE_ENV === "production" &&
  url.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(url.hostname)
)
  throw new Error("Production APP_URL must use HTTPS.");
const directory = path.resolve(process.env.UPLOAD_DIR || "storage/uploads");
const publicDirectory = path.resolve("public");
if (
  directory === publicDirectory ||
  directory.startsWith(publicDirectory + path.sep)
)
  throw new Error("UPLOAD_DIR must be outside the public directory.");
console.log("Environment configuration checks passed.");
