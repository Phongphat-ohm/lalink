import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { HolidayView } from "@/components/admin/holiday-view";
import {
  addHolidayAction,
  updateHolidayAction,
  deleteHolidayAction,
} from "@/features/leave";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addHolidayServerAction(formData: FormData) {
  "use server";
  const res = await addHolidayAction(null, formData);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

async function updateHolidayServerAction(formData: FormData) {
  "use server";
  const res = await updateHolidayAction(null, formData);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

async function deleteHolidayServerAction(holidayId: string) {
  "use server";
  const res = await deleteHolidayAction(holidayId);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

export default async function AdminHolidaysPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.HOLIDAY_MANAGE);
  const currentYear = new Date().getFullYear();

  const rawHolidays = await prisma.holiday.findMany({
    where: { companyId, year: currentYear },
    orderBy: { date: "asc" },
  });

  const holidays = rawHolidays.map((h) => ({
    id: h.id,
    date: h.date.toLocaleDateString("th-TH"),
    isoDate: h.date.toISOString().slice(0, 10),
    weekday: h.date.toLocaleDateString("th-TH", { weekday: "long" }),
    name: h.name,
  }));

  return (
    <HolidayView
      holidays={holidays}
      year={currentYear}
      onAddHoliday={addHolidayServerAction}
      onUpdateHoliday={updateHolidayServerAction}
      onDeleteHoliday={deleteHolidayServerAction}
    />
  );
}
