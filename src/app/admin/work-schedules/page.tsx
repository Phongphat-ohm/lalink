import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { WorkScheduleManagementView } from "@/components/admin/work-schedule-management-view";
import {
  saveWorkScheduleAction,
  toggleWorkScheduleAction,
  deleteWorkScheduleAction,
} from "@/features/leave";

export const dynamic = "force-dynamic";

async function saveWorkScheduleServerAction(formData: FormData) {
  "use server";
  const res = await saveWorkScheduleAction(null, formData);
  revalidatePath("/admin/work-schedules");
  revalidatePath("/admin/shifts");
  return { success: res.success, message: res.message };
}

async function toggleWorkScheduleServerAction(scheduleId: string) {
  "use server";
  const res = await toggleWorkScheduleAction(scheduleId);
  revalidatePath("/admin/work-schedules");
  return { success: res.success, message: res.message };
}

async function deleteWorkScheduleServerAction(scheduleId: string) {
  "use server";
  const res = await deleteWorkScheduleAction(scheduleId);
  revalidatePath("/admin/work-schedules");
  return { success: res.success, message: res.message };
}

export default async function AdminWorkSchedulesPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POLICY_MANAGE);

  const [schedules, shifts, branches, departments, employees] = await Promise.all([
    prisma.workSchedule.findMany({
      where: { companyId },
      include: {
        entries: { orderBy: { dayOfWeek: "asc" } },
        shift: true,
        branch: true,
        department: true,
        employee: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.shift.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { companyId, status: { not: "RESIGNED" } },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { employeeCode: "asc" },
    }),
  ]);

  const serialized = schedules.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    scope: s.scope,
    isActive: s.isActive,
    shiftId: s.shiftId,
    shiftName: s.shift?.name ?? null,
    scopeTargetName: s.employee
      ? `${s.employee.firstName} ${s.employee.lastName}`.trim()
      : (s.department?.name ?? s.branch?.name ?? null),
    scopeTargetId: s.employee
      ? s.employeeId
      : (s.departmentId ?? s.branchId ?? null),
    entries: s.entries.map((e) => ({
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      isWorkingDay: e.isWorkingDay,
    })),
  }));

  return (
    <WorkScheduleManagementView
      schedules={serialized}
      shifts={shifts.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive }))}
      branches={branches}
      departments={departments}
      employees={employees}
      onSaveWorkSchedule={saveWorkScheduleServerAction}
      onToggleWorkSchedule={toggleWorkScheduleServerAction}
      onDeleteWorkSchedule={deleteWorkScheduleServerAction}
    />
  );
}