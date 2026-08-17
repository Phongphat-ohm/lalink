import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { DepartmentView } from "@/components/admin/department-view";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addDepartmentServerAction(name: string, code: string) {
  "use server";
  const session = await getSession();
  if (!session || !session.companyId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.department.create({
      data: {
        companyId: session.companyId,
        name,
        code: code.toUpperCase(),
      },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (err) {
    console.error("Add Department Error:", err);
    return { success: false, message: "ไม่สามารถสร้างแผนกได้" };
  }
}

async function addPositionServerAction(name: string, code: string) {
  "use server";
  const session = await getSession();
  if (!session || !session.companyId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.position.create({
      data: {
        companyId: session.companyId,
        name,
        code: code.toUpperCase(),
      },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (err) {
    console.error("Add Position Error:", err);
    return { success: false, message: "ไม่สามารถสร้างตำแหน่งได้" };
  }
}

export default async function AdminDepartmentsPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

  const [departments, positions] = await Promise.all([
    prisma.department.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.position.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DepartmentView
      departments={departments}
      positions={positions}
      onAddDepartment={addDepartmentServerAction}
      onAddPosition={addPositionServerAction}
    />
  );
}
