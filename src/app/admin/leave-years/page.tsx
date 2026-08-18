import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { LeaveYearView } from "@/components/admin/leave-year-view";
import {
  saveLeaveYearAction,
  activateLeaveYearAction,
  deleteLeaveYearAction,
  runCarryForwardAction,
} from "@/features/leave";

export const dynamic = "force-dynamic";

async function saveLeaveYearServerAction(formData: FormData) {
  "use server";
  const res = await saveLeaveYearAction(null, formData);
  revalidatePath("/admin/leave-years");
  return { success: res.success, message: res.message };
}

async function activateLeaveYearServerAction(leaveYearId: string) {
  "use server";
  const res = await activateLeaveYearAction(leaveYearId);
  revalidatePath("/admin/leave-years");
  revalidatePath("/admin/leave-balance");
  return { success: res.success, message: res.message };
}

async function deleteLeaveYearServerAction(leaveYearId: string) {
  "use server";
  const res = await deleteLeaveYearAction(leaveYearId);
  revalidatePath("/admin/leave-years");
  return { success: res.success, message: res.message };
}

async function runCarryForwardServerAction(formData: FormData) {
  "use server";
  const res = await runCarryForwardAction(null, formData);
  revalidatePath("/admin/leave-years");
  revalidatePath("/admin/leave-balance");
  return { success: res.success, message: res.message };
}

export default async function AdminLeaveYearsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POLICY_MANAGE);

  const rawLeaveYears = await prisma.leaveYear.findMany({
    where: { companyId },
    orderBy: { startDate: "desc" },
  });

  const leaveYears = rawLeaveYears.map((ly) => ({
    id: ly.id,
    name: ly.name,
    year: ly.year,
    startDate: ly.startDate.toISOString().slice(0, 10),
    endDate: ly.endDate.toISOString().slice(0, 10),
    isActive: ly.isActive,
  }));

  return (
    <LeaveYearView
      leaveYears={leaveYears}
      onSaveLeaveYear={saveLeaveYearServerAction}
      onActivateLeaveYear={activateLeaveYearServerAction}
      onDeleteLeaveYear={deleteLeaveYearServerAction}
      onRunCarryForward={runCarryForwardServerAction}
    />
  );
}