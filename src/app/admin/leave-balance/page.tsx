import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  LeaveBalanceView,
  SerializedBalanceEmployee,
  SerializedLeaveTypeOption,
} from "@/components/admin/leave-balance-view";

export const dynamic = "force-dynamic";

export default async function AdminLeaveBalancePage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POLICY_MANAGE);
  const currentYear = new Date().getFullYear();

  const [employees, leaveTypes] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId },
      include: {
        department: { select: { name: true } },
        leaveBalances: {
          where: { year: currentYear },
          include: { leaveType: true },
          orderBy: { leaveType: { name: "asc" } },
        },
      },
      orderBy: { employeeCode: "asc" },
    }),
    prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEmployees: SerializedBalanceEmployee[] = employees.map(
    (emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department,
      balances: emp.leaveBalances.map((b) => ({
        id: b.id,
        leaveTypeId: b.leaveTypeId,
        leaveTypeName: b.leaveType.name,
        leaveTypeCode: b.leaveType.code,
        allocatedDays: Number(b.allocatedDays),
        usedDays: Number(b.usedDays),
        pendingDays: Number(b.pendingDays),
        remainingDays: Number(b.remainingDays),
      })),
    }),
  );

  const serializedLeaveTypes: SerializedLeaveTypeOption[] = leaveTypes.map(
    (t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
    }),
  );

  return (
    <LeaveBalanceView
      employees={serializedEmployees}
      leaveTypes={serializedLeaveTypes}
      currentYear={currentYear}
    />
  );
}
