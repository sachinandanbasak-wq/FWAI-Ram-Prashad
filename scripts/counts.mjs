// Prints row counts for the main tables, so state is known, not assumed.
// Usage: node --env-file=.env.local scripts/counts.mjs
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
  const tables = ["customers", "oems", "oem_contacts", "oem_certificates", "products", "requirements", "requirement_lines"];
  for (const table of tables) {
    const { rows } = await client.query(`select count(*)::int as n from public.${table}`);
    console.log(`${table}: ${rows[0].n}`);
  }
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
