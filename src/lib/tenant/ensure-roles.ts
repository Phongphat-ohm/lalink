import { prisma } from "@/lib/database";
import type { Prisma } from "@prisma/client";

type DbLike = Prisma.TransactionClient | typeof prisma;

/**
 * Standard company-scoped roles. These match the static RBAC matrix in
 * src/lib/permissions/rbac.ts so permission checks work out of the box.
 */
export const STANDARD_COMPANY_ROLES = [
  {
    code: "COMPANY_ADMIN",
    name: "ผู้ดูแลระบบบริษัท (Company Admin)",
    description: "จัดการข้อมูลทั้งหมดภายในบริษัท",
  },
  {
    code: "HR",
    name: "เจ้าหน้าที่ฝ่ายบุคคล (HR)",
    description: "จัดการพนักงาน โควตาวันลา และอนุมัติใบลา",
  },
  {
    code: "MANAGER",
    name: "หัวหน้างาน (Manager)",
    description: "อนุมัติใบลาของลูกทีมในแผนก",
  },
  {
    code: "EMPLOYEE",
    name: "พนักงาน (Employee)",
    description: "ยื่นใบลาและดูประวัติของตนเองผ่าน LINE LIFF",
  },
] as const;

/**
 * Ensures the standard company-scoped roles exist for the given company.
 * Idempotent (upserts by companyId + code).
 */
export async function ensureStandardCompanyRoles(
  companyId: string,
  db: DbLike = prisma,
): Promise<string[]> {
  const ids: string[] = [];

  for (const role of STANDARD_COMPANY_ROLES) {
    const created = await db.role.upsert({
      where: {
        companyId_code: { companyId, code: role.code },
      },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        companyId,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
    ids.push(created.id);
  }

  return ids;
}