import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { del } from "@vercel/blob";
import nextEnv from "@next/env";
if (process.env.E2E_AI_LIVE === "true") nextEnv.loadEnvConfig(process.cwd());
const root = process.cwd();
const runId = randomUUID();
const directory = path.join(root, "storage", "e2e", runId);
await mkdir(directory, { recursive: true });
const port = process.env.E2E_PORT || "3107";
const base = `http://localhost:${port}`;
const connection = new URL(
  process.env.E2E_DATABASE_URL ||
    "postgresql://agri_test:local-test-only@127.0.0.1:5547/agri_test",
);
if (!["localhost", "127.0.0.1"].includes(connection.hostname))
  throw new Error("Browser tests require an isolated local PostgreSQL server.");
connection.searchParams.set("schema", `e2e_${runId.replaceAll("-", "")}`);
const env = {
  ...process.env,
  DATABASE_URL: connection.href,
  DIRECT_URL: connection.href,
  BLOB_READ_WRITE_TOKEN:
    process.env.E2E_BLOB_TEST === "true"
      ? process.env.BLOB_READ_WRITE_TOKEN || ""
      : "",
  JWT_SECRET: randomBytes(48).toString("hex"),
  ADMIN_EMAIL: "admin@example.test",
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  APP_URL: base,
  E2E_BASE_URL: base,
  UPLOAD_DIR: path.join(directory, "uploads"),
  ENABLE_SURVEY_MODULE: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  TRUST_PROXY: "false",
  // Normal regression tests must never spend a configured provider key.
  OPENAI_API_KEY:
    process.env.E2E_AI_LIVE === "true" ? process.env.OPENAI_API_KEY || "" : "",
  OPENAI_MODEL:
    process.env.E2E_AI_LIVE === "true" ? process.env.OPENAI_MODEL || "" : "",
  E2E_RUN_ID: runId,
};
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Command failed (${code}): ${args[0]}`)),
    );
  });
await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
await run(["prisma/seed.js"]);
env.RESET_EMAIL = env.ADMIN_EMAIL;
env.RESET_PASSWORD = env.ADMIN_PASSWORD;
await run(["scripts/reset-password.mjs"]);
const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
// Explicitly isolated test fixtures. No example records enter the application database.
await db.advertisementPackage.create({
  data: {
    id: "e2e-package",
    code: "E2E_ONLY",
    nameMr: "चाचणी जाहिरात",
    nameEn: "E2E test package",
    placementType: "FULL_PAGE",
    colorType: "COLOR",
    price: 1200,
    dimensions: "Test fixture only",
  },
});
await db.publication.create({
  data: {
    titleMr: "चाचणी संग्रह",
    titleEn: "E2E archive",
    editionYear: 2012,
    pdfUrl: "/Agri_SAMAJ_PDF.pdf",
  },
});
await db.$disconnect();
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-H", "localhost", "-p", port],
  { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
server.stdout.on("data", (chunk) => {
  logs += chunk;
});
server.stderr.on("data", (chunk) => {
  logs += chunk;
});
let result = 1;
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw new Error("Test server stopped before readiness.");
    try {
      const response = await fetch(base + "/api/health");
      if (response.ok) break;
    } catch {}
    if (i === 99) throw new Error("Test server did not become ready.");
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(
    "Isolated production server ready; starting browser and API tests.",
  );
  await run([
    "node_modules/@playwright/test/cli.js",
    "test",
    ...process.argv.slice(2),
  ]);
  result = 0;
} catch (e) {
  console.error(e.message);
} finally {
  server.kill();
  await new Promise((resolve) => {
    if (server.exitCode !== null) return resolve();
    server.once("exit", resolve);
    setTimeout(resolve, 5000);
  });
  await writeFile(path.join(directory, "server.log"), logs);
  if (env.BLOB_READ_WRITE_TOKEN) {
    const cleanupDb = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
    });
    try {
      const files = await cleanupDb.upload.findMany({
        where: { blobPath: { not: null } },
      });
      for (const file of files) {
        // Only this run's isolated local schema contains these test-owned paths.
        await del(file.blobPath, { token: env.BLOB_READ_WRITE_TOKEN });
      }
    } finally {
      await cleanupDb.$disconnect();
    }
  }
  console.log(`Isolated test data and server log: storage/e2e/${runId}`);
}
process.exitCode = result;
