"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { AuditLogger } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  parseCsv,
  normalizeHeaders,
  validateImportRow,
  MAX_IMPORT_BYTES,
} from "@/lib/employee/import";
import type { ImportRow, ImportRowError } from "@/lib/employee/import";

import type { ActionResult } from "@/lib/types";

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: ImportRowError[];
  createdCodes: string[];
}

const ACCEPTED_MIME_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
  "application/vnd.ms-excel",
]);

const formSchema = z.object({
  file: z.instanceof(File),
});

/**
 * Server action to bulk-import employees from a CSV file.
 * - Validates headers, each row, department/position/branch references.
 * - Creates employees + seeds initial leave balances atomically.
 * - Records an ImportLog entry for the audit trail.
 */
export async function importEmployeesAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<ImportResult>> {
  try {
    const access = await requireAdminPermission(PERMISSIONS.EMPLOYEE_IMPORT);

    const validated = formSchema.safeParse({
      file: formData.get("file"),
    });
    if (!validated.success) {
      return { success: false, message: "กรุณาเลือกไฟล์ CSV ที่ต้องการนำเข้า" };
    }

    const file = validated.data.file;
    if (file.size === 0) {
      return { success: false, message: "ไฟล์ว่างเปล่า กรุณาเลือกไฟล์อีกครั้ง" };
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return {
        success: false,
        message: "ไฟล์ใหญ่เกิน 2 MB กรุณาลดจำนวนแถวแล้วลองใหม่",
      };
    }

    const mime = (file.type || "").toLowerCase();
    if (!ACCEPTED_MIME_TYPES.has(mime)) {
      return {
        success: false,
        message: "รูปแบบไฟล์ไม่ถูกต้อง ต้องเป็นไฟล์ CSV",
      };
    }

    const csvText = await file.text();
    const parsed = parseCsv(csvText);

    if (parsed.rows.length === 0 && parsed.errors.length === 0) {
      return { success: false, message: "ไฟล์ CSV ไม่มีข้อมูล" };
    }

    const { normalized, missingRequired } = normalizeHeaders(parsed.headers);
    if (missingRequired.length > 0) {
      return {
        success: false,
        message: `คอลัมน์ที่จำเป็นขาดหาย: ${missingRequired.join(", ")}`,
      };
    }

    // Load reference data (scoped to this company)
    const [departments, positions, branches, activeLeaveTypes, existingCodes] =
      await Promise.all([
        prisma.department.findMany({
          where: { companyId: access.companyId },
          select: { id: true, name: true },
        }),
        prisma.position.findMany({
          where: { companyId: access.companyId },
          select: { id: true, name: true },
        }),
        prisma.branch.findMany({
          where: { companyId: access.companyId },
          select: { id: true, code: true },
        }),
        prisma.leaveType.findMany({
          where: { companyId: access.companyId, isActive: true },
          select: { id: true, defaultDays: true },
        }),
        prisma.employee.findMany({
          where: { companyId: access.companyId },
          select: { employeeCode: true },
        }),
      ]);

    const departmentByName = new Map(
      departments.map((d) => [d.name.toLowerCase(), d.id]),
    );
    const positionByName = new Map(
      positions.map((p) => [p.name.toLowerCase(), p.id]),
    );
    const branchByCode = new Map(
      branches.map((b) => [b.code.toLowerCase(), b.id]),
    );
    const existingCodeSet = new Set(existingCodes.map((e) => e.employeeCode));
    const seenCodes = new Set<string>();
    const currentYear = new Date().getFullYear();

    // Validate all rows first
    const validRows: ImportRow[] = [];
    const errors: ImportRowError[] = [...parsed.errors];

    for (let i = 0; i < parsed.rows.length; i++) {
      const rawFields = parsed.rows[i];
      const rowNumber = i + 2; // +1 for the header row, +1 for 1-based line number

      const result = validateImportRow(rawFields, parsed.headers, rowNumber);
      if (!result.ok) {
        errors.push({ rowNumber, message: result.message });
        continue;
      }

      const row = result.data;

      // Duplicate check within the file
      if (seenCodes.has(row.employeeCode)) {
        errors.push({
          rowNumber,
          message: `รหัสพนักงาน "${row.employeeCode}" ซ้ำกันภายในไฟล์`,
        });
        continue;
      }

      // Duplicate check against the database
      if (existingCodeSet.has(row.employeeCode)) {
        errors.push({
          rowNumber,
          message: `รหัสพนักงาน "${row.employeeCode}" มีอยู่ในระบบแล้ว`,
        });
        continue;
      }

      // Reference resolution
      if (row.departmentName && !departmentByName.has(row.departmentName.toLowerCase())) {
        errors.push({
          rowNumber,
          message: `ไม่พบแผนก "${row.departmentName}" ในระบบ`,
        });
        continue;
      }
      if (row.positionName && !positionByName.has(row.positionName.toLowerCase())) {
        errors.push({
          rowNumber,
          message: `ไม่พบตำแหน่ง "${row.positionName}" ในระบบ`,
        });
        continue;
      }
      if (row.branchCode && !branchByCode.has(row.branchCode.toLowerCase())) {
        errors.push({
          rowNumber,
          message: `ไม่พบรหัสสาขา "${row.branchCode}" ในระบบ`,
        });
        continue;
      }

      seenCodes.add(row.employeeCode);
      existingCodeSet.add(row.employeeCode);
      validRows.push(row);
    }

    if (validRows.length === 0) {
      return {
        success: false,
        message: "ไม่พบข้อมูลที่นำเข้าได้ (ทุกแถวมีข้อผิดพลาด)",
        data: {
          totalRows: parsed.rows.length,
          successCount: 0,
          failedCount: parsed.rows.length,
          errors,
          createdCodes: [],
        },
      };
    }

    // Atomic insert of employees + initial leave balances
    let createdCodes: string[] = [];
    await prisma.$transaction(async (tx) => {
      const created = await tx.employee.createMany({
        data: validRows.map((row) => ({
          companyId: access.companyId,
          employeeCode: row.employeeCode,
          firstName: row.firstName,
          lastName: row.lastName,
          dateOfBirth: new Date(row.dateOfBirth),
          email: row.email || null,
          phone: row.phone || null,
          departmentId: row.departmentName
            ? departmentByName.get(row.departmentName.toLowerCase()) || null
            : null,
          positionId: row.positionName
            ? positionByName.get(row.positionName.toLowerCase()) || null
            : null,
          branchId: row.branchCode
            ? branchByCode.get(row.branchCode.toLowerCase()) || null
            : null,
          status: row.status,
          joinedAt: row.joinedAt ? new Date(row.joinedAt) : new Date(),
          resignedAt: null,
        })),
      });

      // Fetch the created rows to know their IDs
      const createdEmployees = await tx.employee.findMany({
        where: {
          companyId: access.companyId,
          employeeCode: { in: validRows.map((r) => r.employeeCode) },
        },
        select: { id: true, employeeCode: true },
      });

      createdCodes = createdEmployees.map((e) => e.employeeCode);

      // Seed leave balances for active leave types
      if (activeLeaveTypes.length > 0) {
        await tx.leaveBalance.createMany({
          data: createdEmployees.flatMap((emp) =>
            activeLeaveTypes.map((lt) => ({
              companyId: access.companyId,
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocatedDays: lt.defaultDays,
              usedDays: 0,
              pendingDays: 0,
              remainingDays: lt.defaultDays,
            })),
          ),
        });
      }

      // Record ImportLog
      await tx.importLog.create({
        data: {
          companyId: access.companyId,
          fileName: file.name,
          fileType: "CSV",
          totalRows: parsed.rows.length,
          successCount: createdEmployees.length,
          failedCount: parsed.rows.length - createdEmployees.length,
          status:
            errors.length > 0 ? "PARTIAL" : "COMPLETED",
          errors: errors.length > 0 ? (errors as unknown as object) : undefined,
          importedBy: access.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: access.companyId,
          actorType: "USER",
          actorId: access.userId,
          action: "IMPORT_EMPLOYEES",
          resource: "Employee",
          details: {
            fileName: file.name,
            totalRows: parsed.rows.length,
            successCount: createdEmployees.length,
            failedCount: parsed.rows.length - createdEmployees.length,
          },
        },
      });
    });

    revalidatePath("/admin/employees");
    revalidatePath("/admin/leave-balance");

    return {
      success: true,
      message:
        errors.length > 0
          ? `นำเข้าเสร็จสิ้น: สำเร็จ ${createdCodes.length} รายการ, ล้มเหลว ${errors.length} รายการ`
          : `นำเข้าพนักงานสำเร็จ ${createdCodes.length} รายการ`,
      data: {
        totalRows: parsed.rows.length,
        successCount: createdCodes.length,
        failedCount: errors.length,
        errors,
        createdCodes,
      },
    };
  } catch (error) {
    console.error("Import Employees Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล กรุณาลองใหม่อีกครั้ง",
    };
  }
}