import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { mkdir, open } from "node:fs/promises";
import path from "node:path";
loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url?.startsWith("file:"))
  throw new Error(
    "The checked-in Prisma schema uses SQLite. Supply a file: DATABASE_URL.",
  );
const target = path.resolve("prisma", url.slice(5));
await mkdir(path.dirname(target), { recursive: true });
try {
  const file = await open(target, "wx");
  await file.close();
  console.log("Created empty SQLite database file.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Existing database preserved.");
}
