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
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const connection = new URL(process.env[name] || "http://missing.invalid");
  if (!["postgres:", "postgresql:"].includes(connection.protocol))
    throw new Error(`${name} must be a PostgreSQL connection URL.`);
  if (
    !["localhost", "127.0.0.1"].includes(connection.hostname) &&
    !["require", "verify-full"].includes(connection.searchParams.get("sslmode"))
  )
    throw new Error(
      `${name} must require TLS for a remote PostgreSQL database.`,
    );
}
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
