import * as XLSX from "xlsx";

export type ExportScope = "ativas" | "respondidas" | "todas";

export function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string; format?: (v: unknown, row: T) => unknown }[],
  filename: string,
  sheetName = "Dados",
) {
  const data = rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      const raw = row[col.key];
      out[col.header] = col.format ? col.format(raw, row) : (raw ?? "");
    }
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

export function formatDateBR(v: unknown): string {
  if (!v || typeof v !== "string") return "";
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return v;
  return `${m[3]}/${m[2]}/${m[1]}`;
}