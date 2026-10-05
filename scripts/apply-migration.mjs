// Applies a SQL migration file to the database in DATABASE_URL and prints the
// resulting schema so the change is proven, not assumed.
//
// Usage: node --env-file=.env.local scripts/apply-migration.mjs 0001_init.sql
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/apply-migration.mjs <file.sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(here, "..", "supabase", "migrations", file);
const sql = readFileSync(sqlPath, "utf8");

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("connected: ok");
  await client.query(sql);
  console.log(`applied: ${file}`);

  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log("public tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");

  const settings = await client.query("select count(*)::int as n from public.settings");
  console.log("settings rows:", settings.rows[0].n);

  const trigger = await client.query(
    "select count(*)::int as n from pg_trigger where tgname = 'audit_settings'",
  );
  console.log("audit_settings trigger:", trigger.rows[0].n);
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
