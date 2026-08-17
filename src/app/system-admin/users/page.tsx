import { prisma } from "@/lib/database";
import {
  UserManagementTable,
  SerializedGlobalUser,
} from "@/components/system-admin/user-management-table";

export const dynamic = "force-dynamic";

export default async function SystemAdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      role: { select: { code: true, name: true } },
      company: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedUsers: SerializedGlobalUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    role: u.role,
    company: u.company,
  }));

  return <UserManagementTable initialUsers={serializedUsers} />;
}
