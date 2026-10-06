// Sets one row in the settings table. Value is stored as JSON.
// Usage: node --env-file=.env.local scripts/set-setting.mjs <key> <value>
import pg from "pg";

const { Client } = pg;
const [key, ...rest] = process.argv.slice(2);
const value = rest.join(" ");

if (!key || value === undefined || rest.length === 0) {
  console.error("Usage: node --env-file=.env.local scripts/set-setting.mjs <key> <value>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(
    `insert into public.settings (key, value)
     values ($1, $2::jsonb)
     on conflict (key) do update
       set value = excluded.value, updated_at = now(), updated_by = null`,
    [key, JSON.stringify(value)],
  );
  const check = await client.query("select value from public.settings where key = $1", [key]);
  console.log(`set ${key} = ${JSON.stringify(check.rows[0].value)}`);
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
