import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
const root = process.cwd();
const runId = randomUUID();
const directory = path.join(root, "storage", "e2e", runId);
await mkdir(directory, { recursive: true });
const port = process.env.E2E_PORT || "3107";
const base = `http://localhost:${port}`;
const env = {
  ...process.env,
  DATABASE_URL: `file:../storage/e2e/${runId}/test.db`,
  JWT_SECRET: randomBytes(48).toString("hex"),
  ADMIN_EMAIL: "admin@example.test",
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  APP_URL: base,
  E2E_BASE_URL: base,
  UPLOAD_DIR: path.join(directory, "uploads"),
  ENABLE_SURVEY_MODULE: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  TRUST_PROXY: "false",
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
await writeFile(path.join(directory, "test.db"), new Uint8Array(), {
  flag: "wx",
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
  console.log(`Isolated test data and server log: storage/e2e/${runId}`);
}
process.exitCode = result;
