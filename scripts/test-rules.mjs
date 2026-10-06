// Proves the database rules by trying to break them.
//
// Each case is bad data that MUST be rejected. If the database accepts it, the
// case FAILS. Everything runs inside a transaction that is rolled back, so no
// test row is ever kept.
//
// Usage: node --env-file=.env.local scripts/test-rules.mjs
import pg from "pg";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

/** Each case is data the database must refuse. */
const MUST_REJECT = [
  { label: "customer name empty", sql: "insert into public.customers (name) values ('')" },
  { label: "customer name only spaces", sql: "insert into public.customers (name) values ('   ')" },
  { label: "customer source not in list", sql: "insert into public.customers (name, source) values ('SAMPLE bad source', 'Carrier pigeon')" },
  { label: "customer stage not in list", sql: "insert into public.customers (name, stage) values ('SAMPLE bad stage', 'Nonsense')" },
  { label: "OEM name empty", sql: "insert into public.oems (name) values ('')" },
  { label: "OEM commission above 100", sql: "insert into public.oems (name, commission_percent) values ('SAMPLE bad', 150)" },
  { label: "OEM commission below 0", sql: "insert into public.oems (name, commission_percent) values ('SAMPLE bad', -1)" },
  { label: "OEM negative lead time", sql: "insert into public.oems (name, typical_lead_time_days) values ('SAMPLE bad', -5)" },
  // These two create a valid OEM first, so the only thing that can fail is the rule under test.
  { label: "certificate type not in list", sql: "insert into public.oems (name) values ('SAMPLE cert host'); insert into public.oem_certificates (oem_id, certification) select id, 'BOGUS' from public.oems where name = 'SAMPLE cert host'" },
  { label: "certificate valid_till before issue_date", sql: "insert into public.oems (name) values ('SAMPLE cert host 2'); insert into public.oem_certificates (oem_id, certification, issue_date, valid_till) select id, 'RCMA', '2026-01-01', '2025-01-01' from public.oems where name = 'SAMPLE cert host 2'" },
  { label: "certificate for a missing OEM (foreign key)", sql: "insert into public.oem_certificates (oem_id, certification) values ('00000000-0000-0000-0000-000000000000', 'RCMA')" },
  { label: "product description empty", sql: "insert into public.products (description) values ('')" },
  { label: "product UoM only spaces", sql: "insert into public.products (description, uom) values ('SAMPLE part', '   ')" },
  { label: "product negative price", sql: "insert into public.products (description, standard_price) values ('SAMPLE part', -10)" },
  { label: "requirement rfi_number blank", sql: "insert into public.requirements (rfi_number) values ('')" },
  { label: "requirement status not in list", sql: "insert into public.requirements (rfi_number, status) values ('SAMPLE bad status', 'Nonsense')" },
  { label: "requirement deadline before received date", sql: "insert into public.requirements (rfi_number, received_date, submission_deadline) values ('SAMPLE bad dates', '2026-01-10', '2026-01-05')" },
  { label: "requirement line quantity zero", sql: "insert into public.requirements (rfi_number) values ('SAMPLE line host'); insert into public.requirement_lines (requirement_id, line_number, part_description, quantity) select id, 1, 'SAMPLE part', 0 from public.requirements where rfi_number = 'SAMPLE line host'" },
  { label: "requirement line duplicate line number", sql: "insert into public.requirements (rfi_number) values ('SAMPLE dup host'); insert into public.requirement_lines (requirement_id, line_number, part_description, quantity) select id, 1, 'SAMPLE a', 1 from public.requirements where rfi_number = 'SAMPLE dup host'; insert into public.requirement_lines (requirement_id, line_number, part_description, quantity) select id, 1, 'SAMPLE b', 1 from public.requirements where rfi_number = 'SAMPLE dup host'" },
];

/** Each case is data that MUST be accepted. */
const MUST_ACCEPT = [
  { label: "valid customer", sql: "insert into public.customers (name) values ('SAMPLE valid customer')" },
  { label: "valid customer pipeline fields", sql: "insert into public.customers (name, phone, source, stage) values ('SAMPLE valid pipeline', '+91-9000000000', 'Referral', 'Quoted')" },
  { label: "valid OEM", sql: "insert into public.oems (name, commission_percent) values ('SAMPLE valid oem', 5)" },
  { label: "valid product", sql: "insert into public.products (description, uom) values ('SAMPLE valid part', 'Nos')" },
  { label: "valid requirement", sql: "insert into public.requirements (rfi_number, status) values ('SAMPLE valid rfi', 'Received')" },
  { label: "valid requirement line", sql: "insert into public.requirements (rfi_number) values ('SAMPLE valid rfi 2'); insert into public.requirement_lines (requirement_id, line_number, part_description, quantity, uom) select id, 1, 'SAMPLE valid part', 5, 'Nos' from public.requirements where rfi_number = 'SAMPLE valid rfi 2'" },
];

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
let failures = 0;

async function runCase(testCase, expectReject) {
  await client.query("begin");
  try {
    await client.query(testCase.sql);
    await client.query("rollback");
    if (expectReject) {
      console.log(`FAIL  accepted bad data: ${testCase.label}`);
      failures += 1;
    } else {
      console.log(`PASS  accepted good data: ${testCase.label}`);
    }
  } catch (error) {
    await client.query("rollback");
    if (expectReject) {
      console.log(`PASS  rejected: ${testCase.label}${error.code ? ` [${error.code}]` : ""}`);
    } else {
      console.log(`FAIL  rejected good data: ${testCase.label} -> ${error.message}`);
      failures += 1;
    }
  }
}

try {
  await client.connect();
  console.log("connected: ok");

  for (const testCase of MUST_REJECT) {
    await runCase(testCase, true);
  }
  for (const testCase of MUST_ACCEPT) {
    await runCase(testCase, false);
  }

  console.log(failures === 0 ? "ALL RULES PASS" : `${failures} RULE(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
