import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { HolidayView } from "@/components/admin/holiday-view";
import {
  addHolidayAction,
  updateHolidayAction,
  deleteHolidayAction,
  importOfficialHolidaysAction,
  getThaiOfficialHolidaysAction,
} from "@/features/leave";
import { toGregorianYear, formatThaiDate } from "@/lib/utils/date";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addHolidayServerAction(formData: FormData) {
  "use server";
  const res = await addHolidayAction(null, formData);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

async function updateHolidayServerAction(formData: FormData) {
  "use server";
  const res = await updateHolidayAction(null, formData);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

async function deleteHolidayServerAction(holidayId: string) {
  "use server";
  const res = await deleteHolidayAction(holidayId);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

async function importOfficialHolidaysServerAction(
  year: number,
  selectedHolidays?: { name: string; date: string }[],
) {
  "use server";
  const res = await importOfficialHolidaysAction(year, selectedHolidays);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/dashboard");
  return res;
}

async function getThaiOfficialHolidaysServerAction(year: number) {
  "use server";
  return await getThaiOfficialHolidaysAction(year);
}

interface AdminHolidaysPageProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function AdminHolidaysPage({
  searchParams,
}: AdminHolidaysPageProps) {
  const { companyId } = await requireAdminPermission(PERMISSIONS.HOLIDAY_MANAGE);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawYear = resolvedSearchParams?.year
    ? parseInt(resolvedSearchParams.year, 10)
    : new Date().getFullYear();
  const currentYear = toGregorianYear(rawYear);

  const rawHolidays = await prisma.holiday.findMany({
    where: { companyId, year: currentYear },
    orderBy: { date: "asc" },
  });

  const holidays = rawHolidays.map((h) => ({
    id: h.id,
    date: formatThaiDate(h.date, "short"),
    isoDate: h.date.toISOString().slice(0, 10),
    weekday: h.date.toLocaleDateString("th-TH", {
      weekday: "long",
      timeZone: "UTC",
    }),
    name: h.name,
  }));

  return (
    <HolidayView
      holidays={holidays}
      year={currentYear}
      onAddHoliday={addHolidayServerAction}
      onUpdateHoliday={updateHolidayServerAction}
      onDeleteHoliday={deleteHolidayServerAction}
      onImportOfficialHolidays={importOfficialHolidaysServerAction}
      onGetThaiHolidays={getThaiOfficialHolidaysServerAction}
    />
  );
}
