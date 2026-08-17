import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { EmployeeTable } from "@/components/admin/employee-table";
import { Badge } from "@/components/ui/badge";

export default async function AdminEmployeesPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

  const [employees, departments, positions] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId },
      orderBy: { employeeCode: "asc" },
      include: { department: true, position: true },
    }),
    prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.position.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEmployees = employees.map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    firstName: emp.firstName,
    lastName: emp.lastName,
    dateOfBirth: emp.dateOfBirth.toISOString(),
    email: emp.email,
    phone: emp.phone,
    status: emp.status,
    lineUserId: emp.lineUserId,
    department: emp.department
      ? { id: emp.department.id, name: emp.department.name }
      : null,
    position: emp.position
      ? { id: emp.position.id, name: emp.position.name }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            จัดการข้อมูลพนักงาน (Employees)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            เพิ่มรายชื่อพนักงาน กำหนดสังกัดแผนก/ตำแหน่ง และตรวจสอบสถานะ LINE
            Linking
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs px-3 py-1 font-semibold w-fit"
        >
          ทั้งหมด {serializedEmployees.length} คน
        </Badge>
      </div>

      <EmployeeTable
        initialEmployees={serializedEmployees}
        departments={departments}
        positions={positions}
      />
    </div>
  );
}
