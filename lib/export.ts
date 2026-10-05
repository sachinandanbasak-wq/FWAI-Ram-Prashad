import ExcelJS from "exceljs";

export type ExportEntity = "customers" | "oems" | "products";

type ColumnSpec = { header: string; key: string; width: number };

type ExportSpec = {
  table: string;
  select: string;
  sheet: string;
  columns: ColumnSpec[];
};

export const EXPORT_SPECS: Record<ExportEntity, ExportSpec> = {
  customers: {
    table: "customers",
    select: "name, division, sub_division, location, gst_number",
    sheet: "Customers",
    columns: [
      { header: "Name", key: "name", width: 34 },
      { header: "Division", key: "division", width: 22 },
      { header: "Sub-division", key: "sub_division", width: 22 },
      { header: "Location", key: "location", width: 22 },
      { header: "GST number", key: "gst_number", width: 24 },
    ],
  },
  oems: {
    table: "oems",
    select: "name, country_of_origin, brand_category, commission_percent, is_approved, vendor_code, gst_number",
    sheet: "OEMs",
    columns: [
      { header: "Name", key: "name", width: 34 },
      { header: "Country of origin", key: "country_of_origin", width: 22 },
      { header: "Category", key: "brand_category", width: 22 },
      { header: "Commission %", key: "commission_percent", width: 16 },
      { header: "Approved", key: "is_approved", width: 12 },
      { header: "Vendor code", key: "vendor_code", width: 18 },
      { header: "GST number", key: "gst_number", width: 24 },
    ],
  },
  products: {
    table: "products",
    select: "description, client_part_number, oem_part_number, hsn_code, uom, category, standard_price",
    sheet: "Products",
    columns: [
      { header: "Description", key: "description", width: 40 },
      { header: "Client part number", key: "client_part_number", width: 22 },
      { header: "OEM part number", key: "oem_part_number", width: 22 },
      { header: "HSN code", key: "hsn_code", width: 16 },
      { header: "Unit of measure", key: "uom", width: 16 },
      { header: "Category", key: "category", width: 20 },
      { header: "Standard price", key: "standard_price", width: 18 },
    ],
  },
};

/** Builds an .xlsx workbook from already-fetched rows. */
export async function buildWorkbook(
  entity: ExportEntity,
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const spec = EXPORT_SPECS[entity];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Defence Contract CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(spec.sheet);
  sheet.columns = spec.columns as ExcelJS.Column[];
  for (const row of rows) {
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
