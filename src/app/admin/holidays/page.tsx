import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { HolidayView } from "@/components/admin/holiday-view";
import { addHolidayAction } from "@/features/leave";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addHolidayServerAction(formData: FormData) {
  "use server";
  const res = await addHolidayAction(null, formData);
  revalidatePath("/admin/holidays");
  revalidatePath("/admin/dashboard");
  return { success: res.success, message: res.message };
}

export default async function AdminHolidaysPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;
  const currentYear = new Date().getFullYear();

  const rawHolidays = await prisma.holiday.findMany({
    where: { companyId, year: currentYear },
    orderBy: { date: "asc" },
  });

  const holidays = rawHolidays.map((h) => ({
    id: h.id,
    date: h.date.toLocaleDateString("th-TH"),
    weekday: h.date.toLocaleDateString("th-TH", { weekday: "long" }),
    name: h.name,
  }));

  return (
    <HolidayView
      holidays={holidays}
      year={currentYear}
      onAddHoliday={addHolidayServerAction}
    />
  );
}
