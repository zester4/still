import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import pg from "pg";
import * as schema from "./schema";

export type StillDb = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

const rawUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
export const databaseUrl = rawUrl && rawUrl.trim() ? rawUrl.trim() : undefined;
export const usingNeon = Boolean(databaseUrl);

const globalRef = globalThis as typeof globalThis & {
  __stillDrizzle__?: Promise<StillDb>;
  __stillPgPool__?: pg.Pool;
};

async function createPgliteDb(): Promise<StillDb> {
  const { PGlite } = await import("@electric-sql/pglite");
  const client = new PGlite();
  await client.waitReady;
  await client.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );

  const dir = join(process.cwd(), "migrations");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  } catch {
    files = [];
  }
  const done = await client.query<{ name: string }>("select name from _migrations");
  const applied = new Set(done.rows.map((r) => r.name));
  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = await readFile(join(dir, name), "utf8");
    await client.exec(sql);
    await client.query("insert into _migrations (name) values ($1)", [name]);
  }

  return drizzlePglite(client, { schema });
}

export async function getDb(): Promise<StillDb> {
  if (typeof window !== "undefined") {
    throw new Error("src/db/config is server-only.");
  }

  globalRef.__stillDrizzle__ ??= (async () => {
    if (databaseUrl) {
      globalRef.__stillPgPool__ ??= new pg.Pool({
        connectionString: databaseUrl,
        max: 5,
      });
      return drizzlePg(globalRef.__stillPgPool__, { schema });
    }
    return createPgliteDb();
  })().catch((err) => {
    globalRef.__stillDrizzle__ = undefined;
    throw err;
  });

  return globalRef.__stillDrizzle__;
}
