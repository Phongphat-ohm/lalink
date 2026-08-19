import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { ShiftManagementView } from "@/components/admin/shift-management-view";
import {
  saveShiftAction,
  toggleShiftAction,
  deleteShiftAction,
} from "@/features/leave";

export const dynamic = "force-dynamic";

async function saveShiftServerAction(formData: FormData) {
  "use server";
  const res = await saveShiftAction(null, formData);
  revalidatePath("/admin/shifts");
  revalidatePath("/admin/work-schedules");
  return { success: res.success, message: res.message };
}

async function toggleShiftServerAction(shiftId: string) {
  "use server";
  const res = await toggleShiftAction(shiftId);
  revalidatePath("/admin/shifts");
  return { success: res.success, message: res.message };
}

async function deleteShiftServerAction(shiftId: string) {
  "use server";
  const res = await deleteShiftAction(shiftId);
  revalidatePath("/admin/shifts");
  revalidatePath("/admin/work-schedules");
  return { success: res.success, message: res.message };
}

export default async function AdminShiftsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POLICY_MANAGE);

  const shifts = await prisma.shift.findMany({
    where: { companyId },
    include: { entries: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { name: "asc" },
  });

  const serialized = shifts.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    entries: s.entries.map((e) => ({
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      isWorkingDay: e.isWorkingDay,
    })),
  }));

  return (
    <ShiftManagementView
      shifts={serialized}
      onSaveShift={saveShiftServerAction}
      onToggleShift={toggleShiftServerAction}
      onDeleteShift={deleteShiftServerAction}
    />
  );
}