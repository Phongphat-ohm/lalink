import { prisma } from "@/lib/database";
import { AuditLogger } from "@/lib/audit";
import { ActorType, EmployeeStatus } from "@prisma/client";

export interface AnonymizeResult {
  success: boolean;
  message?: string;
}

/**
 * PDPA Compliance: Data Minimization & Right to Erasure (Right to be Forgotten)
 * Anonymizes PII data of a departed/resigned employee while preserving
 * financial/leave transaction ledger integrity for tax and labor legal audits.
 */
export async function anonymizeEmployeePII(
  employeeId: string,
  companyId: string,
  performedByUserId: string,
): Promise<AnonymizeResult> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      return {
        success: false,
        message: "ไม่พบข้อมูลพนักงานที่ระบุในบริษัท",
      };
    }

    // Atomic Anonymization
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employee.id },
        data: {
          firstName: "อดีตพนักงาน",
          lastName: `(รหัส ${employee.employeeCode})`,
          email: null,
          phone: null,
          dateOfBirth: new Date("1970-01-01"),
          lineUserId: null,
          status: EmployeeStatus.RESIGNED,
        },
      });

      // Clear non-essential notifications for this employee
      await tx.notification.deleteMany({
        where: {
          companyId,
          recipientId: employee.id,
          recipientType: ActorType.EMPLOYEE,
        },
      });
    });

    // Record Immutable Audit Trail
    await AuditLogger.log({
      companyId,
      actorType: ActorType.USER,
      actorId: performedByUserId,
      action: "PDPA_ANONYMIZE_EMPLOYEE",
      resource: "Employee",
      resourceId: employee.id,
      details: {
        employeeCode: employee.employeeCode,
        reason: "PDPA Right to Erasure / Employee Offboarding",
      },
    });

    return {
      success: true,
      message: "ดำเนินการลบข้อมูลส่วนบุคคล (PDPA Anonymization) เรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("PDPA Anonymize Employee Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูลส่วนบุคคล",
    };
  }
}
