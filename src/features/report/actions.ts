"use server";

import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { generateCsvWithBom } from "./csv-exporter";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

export interface DepartmentStat {
  departmentName: string;
  totalDays: number;
  requestCount: number;
}

export interface LeaveTypeStat {
  leaveTypeName: string;
  totalDays: number;
  requestCount: number;
}

export interface SummaryReportData {
  totalLeaveDays: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalEmployees: number;
  departmentStats: DepartmentStat[];
  leaveTypeStats: LeaveTypeStat[];
}

export async function getLeaveSummaryReportAction(
  year?: number,
): Promise<ActionResult<SummaryReportData>> {
  try {
    const tenant = await requireTenantContext();
    const targetYear = year || new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const [requests, totalEmployees] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: {
          companyId: tenant.companyId,
          startDate: { gte: startDate, lte: endDate },
        },
        include: {
          leaveType: true,
          employee: {
            include: { department: true },
          },
        },
      }),
      prisma.employee.count({
        where: { companyId: tenant.companyId, status: "ACTIVE" },
      }),
    ]);

    let totalLeaveDays = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    const deptMap = new Map<string, { totalDays: number; count: number }>();
    const typeMap = new Map<string, { totalDays: number; count: number }>();

    for (const req of requests) {
      const days = Number(req.totalDays);

      if (req.status === "APPROVED") {
        approvedCount += 1;
        totalLeaveDays += days;
      } else if (req.status === "PENDING") {
        pendingCount += 1;
      } else if (req.status === "REJECTED") {
        rejectedCount += 1;
      }

      // Department aggregation
      const deptName = req.employee.department?.name || "ไม่ระบุแผนก";
      const curDept = deptMap.get(deptName) || { totalDays: 0, count: 0 };
      if (req.status === "APPROVED") curDept.totalDays += days;
      curDept.count += 1;
      deptMap.set(deptName, curDept);

      // Leave Type aggregation
      const typeName = req.leaveType.name;
      const curType = typeMap.get(typeName) || { totalDays: 0, count: 0 };
      if (req.status === "APPROVED") curType.totalDays += days;
      curType.count += 1;
      typeMap.set(typeName, curType);
    }

    const departmentStats: DepartmentStat[] = Array.from(deptMap.entries()).map(
      ([departmentName, stat]) => ({
        departmentName,
        totalDays: stat.totalDays,
        requestCount: stat.count,
      }),
    );

    const leaveTypeStats: LeaveTypeStat[] = Array.from(typeMap.entries()).map(
      ([leaveTypeName, stat]) => ({
        leaveTypeName,
        totalDays: stat.totalDays,
        requestCount: stat.count,
      }),
    );

    return {
      success: true,
      data: {
        totalLeaveDays,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalEmployees,
        departmentStats,
        leaveTypeStats,
      },
    };
  } catch (error) {
    console.error("Get Leave Summary Report Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงรายงานสรุป",
    };
  }
}

export async function exportLeaveRequestsCsvAction(
  year?: number,
): Promise<ActionResult<{ csvContent: string; filename: string }>> {
  try {
    const tenant = await requireTenantContext();
    const targetYear = year || new Date().getFullYear();

    const requests = await prisma.leaveRequest.findMany({
      where: {
        companyId: tenant.companyId,
        startDate: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31, 23, 59, 59),
        },
      },
      include: {
        employee: { include: { department: true } },
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "เลขที่ใบลา",
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "แผนก",
      "ประเภทการลา",
      "วันที่เริ่ม",
      "วันที่สิ้นสุด",
      "ช่วงเวลาเริ่ม",
      "ช่วงเวลาสิ้นสุด",
      "จำนวนวัน",
      "สถานะ",
      "เหตุผล",
      "เหตุผลการปฏิเสธ",
      "วันที่ยื่นใบลา",
    ];

    const statusMap: Record<string, string> = {
      APPROVED: "อนุมัติแล้ว",
      PENDING: "รออนุมัติ",
      REJECTED: "ไม่อนุมัติ",
      CANCELLED: "ยกเลิกแล้ว",
    };

    const periodMap: Record<string, string> = {
      FULL_DAY: "เต็มวัน",
      HALF_DAY_AM: "ครึ่งวันเช้า",
      HALF_DAY_PM: "ครึ่งวันบ่าย",
    };

    const rows = requests.map((req) => [
      req.requestNumber,
      req.employee.employeeCode,
      `${req.employee.firstName} ${req.employee.lastName}`,
      req.employee.department?.name || "-",
      req.leaveType.name,
      req.startDate.toLocaleDateString("th-TH"),
      req.endDate.toLocaleDateString("th-TH"),
      periodMap[req.startPeriod] || req.startPeriod,
      periodMap[req.endPeriod] || req.endPeriod,
      Number(req.totalDays),
      statusMap[req.status] || req.status,
      req.reason || "-",
      req.rejectionReason || "-",
      req.createdAt.toLocaleDateString("th-TH"),
    ]);

    const csvContent = generateCsvWithBom(headers, rows);
    const filename = `leave_requests_${targetYear}.csv`;

    return {
      success: true,
      data: { csvContent, filename },
    };
  } catch (error) {
    console.error("Export Leave Requests CSV Error:", error);
    return {
      success: false,
      message: "ไม่สามารถส่งออกข้อมูลเป็น CSV ได้",
    };
  }
}

export async function exportEmployeeBalancesCsvAction(
  year?: number,
): Promise<ActionResult<{ csvContent: string; filename: string }>> {
  try {
    const tenant = await requireTenantContext();
    const targetYear = year || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: {
        companyId: tenant.companyId,
        year: targetYear,
      },
      include: {
        employee: { include: { department: true, position: true } },
        leaveType: true,
      },
      orderBy: [
        { employee: { employeeCode: "asc" } },
        { leaveType: { name: "asc" } },
      ],
    });

    const headers = [
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "แผนก",
      "ตำแหน่ง",
      "ปี",
      "ประเภทวันลา",
      "โควตาทั้งหมด (วัน)",
      "ยกยอดมา (วัน)",
      "ใช้ไปแล้ว (วัน)",
      "รออนุมัติ (วัน)",
      "คงเหลือ (วัน)",
    ];

    const rows = balances.map((b) => [
      b.employee.employeeCode,
      `${b.employee.firstName} ${b.employee.lastName}`,
      b.employee.department?.name || "-",
      b.employee.position?.name || "-",
      b.year,
      b.leaveType.name,
      Number(b.allocatedDays),
      Number(b.carriedForwardDays),
      Number(b.usedDays),
      Number(b.pendingDays),
      Number(b.remainingDays),
    ]);

    const csvContent = generateCsvWithBom(headers, rows);
    const filename = `employee_leave_balances_${targetYear}.csv`;

    return {
      success: true,
      data: { csvContent, filename },
    };
  } catch (error) {
    console.error("Export Employee Balances CSV Error:", error);
    return {
      success: false,
      message: "ไม่สามารถส่งออกข้อมูลยอดวันลาคงเหลือได้",
    };
  }
}
