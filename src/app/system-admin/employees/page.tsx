import { prisma } from "@/lib/database";
import {
  SuperAdminEmployeeTable,
  SerializedSuperAdminEmployee,
  AvailableCompanyFilter,
} from "@/components/system-admin/super-admin-employee-table";

export const dynamic = "force-dynamic";

export default async function SystemAdminEmployeesPage() {
  const [employees, companies] = await Promise.all([
    prisma.employee.findMany({
      include: {
        company: { select: { id: true, name: true, code: true } },
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEmployees: SerializedSuperAdminEmployee[] = employees.map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    firstName: emp.firstName,
    lastName: emp.lastName,
    dateOfBirth: emp.dateOfBirth instanceof Date ? emp.dateOfBirth.toISOString().split("T")[0] : String(emp.dateOfBirth),
    email: emp.email,
    phone: emp.phone,
    status: emp.status,
    lineUserId: emp.lineUserId,
    createdAt: emp.createdAt.toISOString(),
    company: emp.company,
    department: emp.department,
    position: emp.position,
  }));

  const availableCompanies: AvailableCompanyFilter[] = companies;

  return (
    <SuperAdminEmployeeTable
      initialEmployees={serializedEmployees}
      companies={availableCompanies}
    />
  );
}
