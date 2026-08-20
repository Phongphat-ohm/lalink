import { prisma } from "@/lib/database";
import {
  UserManagementTable,
  SerializedGlobalUser,
  AvailableRole,
  AvailableCompany,
} from "@/components/system-admin/user-management-table";

export const dynamic = "force-dynamic";

export default async function SystemAdminUsersPage() {
  const [users, roles, companies] = await Promise.all([
    prisma.user.findMany({
      include: {
        role: { select: { id: true, code: true, name: true } },
        company: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedUsers: SerializedGlobalUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    role: u.role,
    company: u.company,
  }));

  const availableRoles: AvailableRole[] = roles;
  const availableCompanies: AvailableCompany[] = companies;

  return (
    <UserManagementTable
      initialUsers={serializedUsers}
      availableRoles={availableRoles}
      availableCompanies={availableCompanies}
    />
  );
}
