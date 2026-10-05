// Prints the real schema so a change is proven, not assumed.
// Usage: node --env-file=.env.local scripts/db-status.mjs
import pg from "pg";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("connected: ok");

  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log("public tables:", tables.rows.map((r) => r.table_name).join(", ") || "(none)");

  const settings = await client.query("select count(*)::int as n from public.settings");
  console.log("settings rows:", settings.rows[0].n);

  const policies = await client.query(
    `select tablename, policyname, cmd, roles::text as roles
       from pg_policies where schemaname = 'public'
       order by tablename, policyname`,
  );
  for (const p of policies.rows) {
    console.log(`policy ${p.tablename}.${p.policyname} [${p.cmd}] roles=${p.roles}`);
  }
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
