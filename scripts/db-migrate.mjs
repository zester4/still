#!/usr/bin/env node
/**
 * Apply Drizzle SQL.
 *
 * With DATABASE_URL (Neon on deploy): apply files in drizzle/ then
 * migrations/*.sql that the platform also tracks.
 * Without DATABASE_URL: skip — PGLite applies migrations/*.sql at startup.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.log("[db:migrate] DATABASE_URL not set — skipping (PGLite applies migrations/ on boot).");
  process.exit(0);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", cwd: root, env: process.env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  const journal = join(root, "drizzle", "meta", "_journal.json");
  if (existsSync(journal)) {
    await run("npx", ["drizzle-kit", "migrate"]);
  }
  await run("node", [join(root, "scripts/migrate.mjs")]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
