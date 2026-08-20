import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { LeaveRequestsTable } from "@/components/admin/leave-requests-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminLeaveRequestsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.LEAVE_APPROVE);

  const [leaveRequests, employees, leaveTypes] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          include: { department: true, position: true },
        },
        leaveType: true,
        leaveApprovals: { orderBy: { stepOrder: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.employee.findMany({
      where: { companyId, status: { in: ["ACTIVE", "PROBATION"] } },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedRequests = leaveRequests.map((req) => ({
    id: req.id,
    requestNumber: req.requestNumber,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
    startPeriod: req.startPeriod,
    endPeriod: req.endPeriod,
    totalDays: Number(req.totalDays),
    reason: req.reason,
    status: req.status,
    rejectionReason: req.rejectionReason,
    approvedBy: req.approvedBy,
    createdAt: req.createdAt.toISOString(),
    approvals: req.leaveApprovals.map((a) => ({
      id: a.id,
      stepOrder: a.stepOrder,
      roleCode: a.roleCode,
      status: a.status,
      comment: a.comment,
      approverId: a.approverId,
      actedAt: a.actedAt ? a.actedAt.toISOString() : null,
    })),
    attachments: req.attachments.map((att) => ({
      id: att.id,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      createdAt: att.createdAt.toISOString(),
    })),
    employee: {
      id: req.employee.id,
      employeeCode: req.employee.employeeCode,
      firstName: req.employee.firstName,
      lastName: req.employee.lastName,
      email: req.employee.email,
      phone: req.employee.phone,
      department: req.employee.department
        ? { name: req.employee.department.name }
        : null,
      position: req.employee.position
        ? { name: req.employee.position.name }
        : null,
    },
    leaveType: {
      id: req.leaveType.id,
      name: req.leaveType.name,
      code: req.leaveType.code,
      isPaid: req.leaveType.isPaid,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            รายการคำขอและการอนุมัติใบลา
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            คลิกที่รายการเพื่อดูรายละเอียดแบบเต็ม ดำเนินการอนุมัติ/ไม่อนุมัติ หรือยื่นใบลาแทนพนักงาน
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs px-3 py-1 font-semibold w-fit"
        >
          ทั้งหมด {serializedRequests.length} รายการ
        </Badge>
      </div>

      <LeaveRequestsTable
        initialRequests={serializedRequests}
        availableEmployees={employees}
        availableLeaveTypes={leaveTypes}
      />
    </div>
  );
}
