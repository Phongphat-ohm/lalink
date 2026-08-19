import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB

export const IMPORT_HEADERS = [
  "employeeCode",
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "departmentName",
  "positionName",
  "branchCode",
  "status",
  "joinedAt",
] as const;

export type ImportHeader = (typeof IMPORT_HEADERS)[number];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const EMPLOYEE_IMPORT_STATUSES = [
  EmployeeStatus.ACTIVE,
  EmployeeStatus.PROBATION,
  EmployeeStatus.INACTIVE,
] as const;

export interface ImportRow {
  rowNumber: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  departmentName?: string;
  positionName?: string;
  branchCode?: string;
  status: EmployeeStatus;
  joinedAt?: string;
}

export interface ImportRowError {
  rowNumber: number;
  message: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  errors: ImportRowError[];
}

/** Splits a single CSV line into fields, honoring double-quoted values. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** Parses raw CSV text into headers + rows, returning structural errors. */
export function parseCsv(csvText: string): ParsedCsv {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd());

  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { headers: [], rows: [], errors: [] };
  }

  const headers = parseCsvLine(nonEmpty[0]);

  const rows: string[][] = [];
  const errors: ImportRowError[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const fields = parseCsvLine(nonEmpty[i]);
    if (fields.length !== headers.length) {
      errors.push({
        rowNumber: i + 1,
        message: `จำนวนคอลัมน์ไม่ตรงกับส่วนหัว (คาด ${headers.length} ได้รับ ${fields.length})`,
      });
      continue;
    }
    rows.push(fields);
  }

  return { headers, rows, errors };
}

const rowSchema = z.object({
  employeeCode: z
    .string()
    .min(1, "รหัสพนักงานห้ามว่าง")
    .max(50, "รหัสพนักงานยาวเกิน 50 ตัวอักษร")
    .trim()
    .toUpperCase(),
  firstName: z.string().min(1, "ชื่อห้ามว่าง").max(100).trim(),
  lastName: z.string().min(1, "นามสกุลห้ามว่าง").max(100).trim(),
  dateOfBirth: z
    .string()
    .regex(ISO_DATE_RE, "วันเกิดต้องเป็นรูปแบบ YYYY-MM-DD"),
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional(),
  departmentName: z.string().max(200).optional(),
  positionName: z.string().max(200).optional(),
  branchCode: z.string().max(50).trim().toUpperCase().optional(),
  status: z.enum(EMPLOYEE_IMPORT_STATUSES).default(EmployeeStatus.ACTIVE),
  joinedAt: z
    .string()
    .regex(ISO_DATE_RE, "วันที่เริ่มงานต้องเป็นรูปแบบ YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
});

/**
 * Validates a raw CSV row (from parseCsv) against the import schema.
 * Returns the normalized row or a human-readable error message.
 */
export function validateImportRow(
  fields: string[],
  headers: string[],
  rowNumber: number,
): { ok: true; data: ImportRow } | { ok: false; message: string } {
  const headerIndex = new Map(
    headers.map((h, idx) => [h.trim().toLowerCase(), idx]),
  );
  const get = (header: string): string | undefined => {
    const idx = headerIndex.get(header.toLowerCase());
    return idx !== undefined ? fields[idx] ?? "" : undefined;
  };

  const raw = {
    employeeCode: get("employeeCode"),
    firstName: get("firstName"),
    lastName: get("lastName"),
    dateOfBirth: get("dateOfBirth"),
    email: get("email") || undefined,
    phone: get("phone") || undefined,
    departmentName: get("departmentName") || undefined,
    positionName: get("positionName") || undefined,
    branchCode: get("branchCode") || undefined,
    status: (get("status") || "ACTIVE").toUpperCase(),
    joinedAt: get("joinedAt") || undefined,
  };

  const parsed = rowSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.path.join(".") || "ข้อมูลไม่ถูกต้อง";
    const message =
      parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";
    return {
      ok: false,
      message: `${firstError}: ${message}`,
    };
  }

  return {
    ok: true,
    data: {
      rowNumber,
      employeeCode: parsed.data.employeeCode,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      departmentName: parsed.data.departmentName || undefined,
      positionName: parsed.data.positionName || undefined,
      branchCode: parsed.data.branchCode || undefined,
      status: parsed.data.status,
      joinedAt: parsed.data.joinedAt || undefined,
    },
  };
}

/** Normalizes the header row into canonical lowercase names, detecting required columns. */
export function normalizeHeaders(headers: string[]): {
  normalized: string[];
  missingRequired: string[];
} {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const required = ["employeecode", "firstname", "lastname", "dateofbirth"];
  const missingRequired = required.filter((r) => !normalized.includes(r));
  return { normalized, missingRequired };
}

/** Builds a CSV template string for download. */
export function buildImportTemplate(): string {
  const header = IMPORT_HEADERS.join(",");
  const example =
    "EMP-101,สมชาย,ใจดี,1990-01-15,somchai@company.com,0812345678,ฝ่ายบุคคล,HR Specialist,HQ,ACTIVE,2024-01-01";
  return `${header}\n${example}\n`;
}