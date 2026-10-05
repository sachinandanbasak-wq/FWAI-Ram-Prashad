// Applies a SQL file to the database in DATABASE_URL and prints the resulting
// schema so the change is proven, not assumed.
//
// The argument may be a path relative to the project root (e.g. supabase/seed.sql)
// or a bare filename found in supabase/migrations (e.g. 0001_init.sql).
//
// Usage: node --env-file=.env.local scripts/apply-migration.mjs <file.sql>
import { existsSync, readFileSync } from "node:fs";
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
const asGiven = join(process.cwd(), file);
const inMigrations = join(here, "..", "supabase", "migrations", file);
const sqlPath = existsSync(asGiven) ? asGiven : inMigrations;

if (!existsSync(sqlPath)) {
  console.error(`SQL file not found: ${file}`);
  process.exit(1);
}

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
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
