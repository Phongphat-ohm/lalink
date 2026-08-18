import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { UserManagementView } from "@/components/admin/user-management-view";
import {
  createUserAction,
  updateUserAction,
  resetUserPasswordAction,
} from "@/features/user";

export const dynamic = "force-dynamic";

async function createUserServerAction(formData: FormData) {
  "use server";
  const res = await createUserAction(null, formData);
  revalidatePath("/admin/users");
  return { success: res.success, message: res.message };
}

async function updateUserServerAction(formData: FormData) {
  "use server";
  const res = await updateUserAction(null, formData);
  revalidatePath("/admin/users");
  return { success: res.success, message: res.message };
}

async function resetPasswordServerAction(formData: FormData) {
  "use server";
  const res = await resetUserPasswordAction(null, formData);
  revalidatePath("/admin/users");
  return { success: res.success, message: res.message };
}

export default async function AdminUsersPage() {
  const { companyId, userId } = await requireAdminPermission(
    PERMISSIONS.USER_MANAGE,
  );

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { companyId },
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      where: { companyId, code: { not: "SYSTEM_ADMIN" } },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    role: u.role ? { id: u.role.id, code: u.role.code, name: u.role.name } : null,
    isSelf: u.id === userId,
  }));

  const serializedRoles = roles.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
  }));

  return (
    <UserManagementView
      users={serializedUsers}
      roles={serializedRoles}
      onCreateUser={createUserServerAction}
      onUpdateUser={updateUserServerAction}
      onResetPassword={resetPasswordServerAction}
    />
  );
}