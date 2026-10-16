import { spawnSync } from "node:child_process";
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL)
  throw new Error("Configure DATABASE_URL and DIRECT_URL before deploying.");
if (!process.env.BLOB_READ_WRITE_TOKEN)
  throw new Error("Connect a private Vercel Blob store before deploying.");
for (const args of [
  ["scripts/check-env.mjs"],
  ["node_modules/prisma/build/index.js", "generate"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/next/dist/bin/next", "build"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
