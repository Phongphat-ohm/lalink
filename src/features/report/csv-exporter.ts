/**
 * Converts headers and row data into an RFC-4180 compliant CSV string
 * with UTF-8 BOM prefix for perfect Thai language support in Excel.
 */
export function generateCsvWithBom(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const UTF8_BOM = "\uFEFF";

  function escapeCsvCell(cell: unknown): string {
    if (cell === null || cell === undefined) return "";
    const str = String(cell);
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));

  return UTF8_BOM + [headerLine, ...rowLines].join("\r\n");
}
