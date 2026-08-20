/**
 * PostgreSQL SQL Dump Generator
 * Converts JSON snapshot records into standard, executable SQL statements
 */

function formatSqlValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "NULL";
  }
  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE";
  }
  if (typeof val === "number") {
    return Number.isFinite(val) ? String(val) : "NULL";
  }
  if (typeof val === "bigint") {
    return val.toString();
  }
  if (val instanceof Date) {
    return `'${val.toISOString()}'::timestamptz`;
  }
  if (typeof val === "string") {
    // Check if it's an ISO Date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) && !isNaN(Date.parse(val))) {
      return `'${val}'::timestamptz`;
    }
    // Escape single quotes: ' -> ''
    const escaped = val.replace(/'/g, "''");
    return `'${escaped}'`;
  }
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generatePostgreSqlDump(
  tableData: Record<string, { dbTableName: string; rows: any[] }>,
  metadata: {
    version: string;
    exportedAt: string;
    totalRecords: number;
    checksum: string;
  },
): string {
  const lines: string[] = [];

  // SQL Header
  lines.push("-- =====================================================================");
  lines.push("-- LALINK Multi-Tenant SaaS - Database Backup SQL Dump");
  lines.push(`-- Version: ${metadata.version}`);
  lines.push(`-- Exported At: ${metadata.exportedAt}`);
  lines.push(`-- Total Records: ${metadata.totalRecords}`);
  lines.push(`-- SHA-256 Checksum: ${metadata.checksum}`);
  lines.push("-- =====================================================================");
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");
  lines.push("-- Disable foreign key checks during import");
  lines.push("SET session_replication_role = 'replica';");
  lines.push("");

  for (const [key, { dbTableName, rows }] of Object.entries(tableData)) {
    if (!rows || rows.length === 0) continue;

    lines.push(`-- ---------------------------------------------------------------------`);
    lines.push(`-- Table: "${dbTableName}" (${rows.length} records)`);
    lines.push(`-- ---------------------------------------------------------------------`);

    // Extract columns from first non-empty object
    const columns = Object.keys(rows[0]);
    const quotedCols = columns.map((c) => `"${c}"`).join(", ");

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const valuesList = batch
        .map((row) => {
          const values = columns.map((col) => formatSqlValue(row[col])).join(", ");
          return `  (${values})`;
        })
        .join(",\n");

      lines.push(`INSERT INTO "${dbTableName}" (${quotedCols}) VALUES`);
      lines.push(`${valuesList};`);
    }

    lines.push("");
  }

  lines.push("-- Re-enable foreign key constraints");
  lines.push("SET session_replication_role = 'DEFAULT';");
  lines.push("");
  lines.push("COMMIT;");
  lines.push("");
  lines.push("-- End of SQL Backup Dump");

  return lines.join("\n");
}
