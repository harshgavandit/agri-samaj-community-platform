import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";

// Only an empty PostgreSQL schema can be populated. The source is opened read-only.
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const sourcePath = path.resolve(option("--source", "prisma/dev.db"));
const envFile = option("--env");
if (envFile)
  Object.assign(process.env, parseEnv(await readFile(envFile, "utf8")));
const target =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;
if (!target || !/^postgres(ql)?:\/\//.test(target))
  throw new Error("Set a PostgreSQL target connection.");
const db = new PrismaClient({ datasources: { db: { url: target } } });
const source = new DatabaseSync(sourcePath, { readOnly: true });
const order = [
  "User",
  "BusinessCategory",
  "BusinessProfile",
  "AdvertisementPackage",
  "AdvertisementBooking",
  "Publication",
  "Announcement",
  "ContactInquiry",
  "AuditLog",
  "CensusTracker",
  "Upload",
  "RateLimit",
];
const models = new Map(
  Prisma.dmmf.datamodel.models.map((model) => [model.name, model]),
);
const delegate = (name) => name[0].toLowerCase() + name.slice(1);
const normalize = (name, rows) =>
  rows.map((row) =>
    Object.fromEntries(
      models
        .get(name)
        .fields.filter((field) => field.kind !== "object" && field.name in row)
        .map((field) => {
          let value = row[field.name];
          if (value !== null && field.type === "Boolean") value = !!value;
          if (value !== null && field.type === "DateTime") {
            value = new Date(value);
            if (!Number.isFinite(value.getTime()))
              throw new Error(`Invalid date in ${name}.${field.name}`);
          }
          return [field.name, value];
        }),
    ),
  );
function digest(name, rows, fields) {
  const key = name === "RateLimit" ? "key" : "id";
  const normalized = rows.map((row) =>
    Object.fromEntries(fields.map((field) => [field, row[field]])),
  );
  normalized.sort((a, b) => String(a[key]).localeCompare(String(b[key])));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
try {
  const evidenceDir = path.resolve("storage", "migration", randomUUID());
  await mkdir(evidenceDir, { recursive: true });
  const snapshotPath = path.join(evidenceDir, "sqlite-backup.db");
  await backup(source, snapshotPath);
  const snapshot = new DatabaseSync(snapshotPath, { readOnly: true });
  const data = new Map();
  for (const name of order)
    data.set(
      name,
      normalize(name, snapshot.prepare(`SELECT * FROM "${name}"`).all()),
    );
  snapshot.close();
  const report = {
    source: "SQLite backup",
    target: "PostgreSQL",
    verifiedAt: new Date().toISOString(),
    tables: {},
  };
  await db.$transaction(
    async (tx) => {
      // Serialize competing transfer runs; no table is cleared or overwritten.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(68473125)`;
      for (const name of order) {
        if (await tx[delegate(name)].count())
          throw new Error(`Target ${name} is not empty. Transfer refused.`);
      }
      for (const name of order) {
        const rows = data.get(name);
        for (let offset = 0; offset < rows.length; offset += 100)
          await tx[delegate(name)].createMany({
            data: rows.slice(offset, offset + 100),
          });
        const actual = await tx[delegate(name)].findMany();
        const fields = models
          .get(name)
          .fields.filter(
            (f) => f.kind !== "object" && rows.some((r) => f.name in r),
          )
          .map((f) => f.name);
        const before = digest(name, rows, fields);
        const after = digest(name, actual, fields);
        if (actual.length !== rows.length || before !== after)
          throw new Error(`Verification failed for ${name}.`);
        report.tables[name] = {
          count: rows.length,
          sha256: after,
          matches: true,
        };
      }
    },
    { timeout: 120_000, maxWait: 30_000 },
  );
  await writeFile(
    path.join(evidenceDir, "verification.json"),
    JSON.stringify(report, null, 2),
    { mode: 0o600 },
  );
  console.log(
    "SQLite source preserved. PostgreSQL transaction committed after exact row verification.",
  );
  for (const [name, result] of Object.entries(report.tables))
    console.log(`${name}: ${result.count} rows verified`);
  console.log(`Private backup and verification report: ${evidenceDir}`);
} catch (error) {
  // Prisma errors may contain private connection or row data; keep diagnostics bounded.
  console.error(
    error.message?.startsWith("Target ") ||
      error.message?.startsWith("Verification ")
      ? error.message
      : "Transfer failed; the transaction was rolled back. Check schema, connection, and source data.",
  );
  process.exitCode = 1;
} finally {
  source.close();
  await db.$disconnect();
}
