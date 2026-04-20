import ExcelJS from "exceljs";
import { BadRequestError } from "./http-errors.js";

export type ImportResult = {
  records: Array<Record<string, any>>;
};

function normalizeHeader(h: any) {
  return String(h ?? "").trim();
}

export async function parseCsv(buffer: Buffer) {
  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new BadRequestError("CSV must include header and at least one row");
  }

  const headers = lines[0].split(",").map((h) => normalizeHeader(h));
  const records: Array<Record<string, any>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    records.push(row);
  }

  return { headers, records };
}

export async function parseExcel(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new BadRequestError("No worksheet found");
  }

  const headerRow = sheet.getRow(1);
  const values = Array.isArray(headerRow.values) ? headerRow.values : [];
  const headers = values.slice(1).map((v: any) => normalizeHeader(v));

  const records: Array<Record<string, any>> = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const rec: Record<string, any> = {};
    headers.forEach((h: string, idx: number) => {
      rec[h] = row.getCell(idx + 1).value ?? "";
    });
    records.push(rec);
  }

  return { headers, records };
}
