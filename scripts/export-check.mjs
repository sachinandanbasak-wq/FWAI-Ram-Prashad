// Proves the Excel export works on real rows: reads the SAMPLE master rows from
// the database, builds an .xlsx file, then re-opens it and reports what is
// inside. This tests the data -> workbook path independently of the login.
//
// Usage: node --env-file=.env.local scripts/export-check.mjs
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import pg from "pg";
import ExcelJS from "exceljs";

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

  const { rows } = await client.query(
    "select name, division, sub_division, location, gst_number from public.customers order by name",
  );
  console.log("rows read from database:", rows.length);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Defence Contract CRM";
  const sheet = workbook.addWorksheet("Customers");
  sheet.columns = [
    { header: "Name", key: "name", width: 34 },
    { header: "Division", key: "division", width: 22 },
    { header: "Sub-division", key: "sub_division", width: 22 },
    { header: "Location", key: "location", width: 22 },
    { header: "GST number", key: "gst_number", width: 24 },
  ];
  for (const row of rows) sheet.addRow(row);
  sheet.getRow(1).font = { bold: true };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const outPath = join(tmpdir(), "defence-crm-export-check.xlsx");
  writeFileSync(outPath, buffer);
  console.log("wrote:", outPath, "bytes:", buffer.length);

  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.readFile(outPath);
  const reopenedSheet = reopened.getWorksheet("Customers");
  console.log("reopened sheet:", reopenedSheet.name);
  console.log("reopened rows (including header):", reopenedSheet.rowCount);
  console.log("first header cell:", reopenedSheet.getRow(1).getCell(1).value);
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
