import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  AdminCalendarView,
  SerializedAdminCalendarLeave,
  SerializedAdminCalendarHoliday,
  DepartmentOption,
} from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.LEAVE_READ);
  const currentYear = new Date().getFullYear();

  const [leaveRequests, holidays, departments] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        companyId,
        status: { in: ["APPROVED", "PENDING"] },
      },
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            position: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.holiday.findMany({
      where: {
        companyId,
        year: currentYear,
      },
      orderBy: { date: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedLeaves: SerializedAdminCalendarLeave[] = leaveRequests.map(
    (l) => ({
      id: l.id,
      requestNumber: l.requestNumber,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      startPeriod: l.startPeriod,
      endPeriod: l.endPeriod,
      status: l.status,
      totalDays: Number(l.totalDays),
      reason: l.reason || "",
      employee: {
        id: l.employee.id,
        employeeCode: l.employee.employeeCode,
        firstName: l.employee.firstName,
        lastName: l.employee.lastName,
        department: l.employee.department,
        position: l.employee.position,
      },
      leaveType: {
        name: l.leaveType.name,
        code: l.leaveType.code,
      },
    }),
  );

  const serializedHolidays: SerializedAdminCalendarHoliday[] = holidays.map(
    (h) => ({
      id: h.id,
      date: h.date.toISOString(),
      name: h.name,
    }),
  );

  const serializedDepartments: DepartmentOption[] = departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  return (
    <AdminCalendarView
      initialLeaves={serializedLeaves}
      initialHolidays={serializedHolidays}
      departments={serializedDepartments}
    />
  );
}
