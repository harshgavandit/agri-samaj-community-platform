import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
const [envFile, script, ...args] = process.argv.slice(2);
if (!envFile || !script)
  throw new Error(
    "Usage: node scripts/with-env.mjs <env-file> <node-script> [args]",
  );
const child = spawn(process.execPath, [script, ...args], {
  env: { ...process.env, ...parseEnv(readFileSync(envFile, "utf8")) },
  stdio: "inherit",
  windowsHide: true,
});
child.on("error", () => {
  console.error("Unable to start the requested script.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
