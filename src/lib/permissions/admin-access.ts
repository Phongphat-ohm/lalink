import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "./rbac";

export interface AdminAccess {
  companyId: string;
  userId: string;
  role: string;
}

/**
 * Guards an admin page: requires a USER session with the given permission.
 * Redirects to login when unauthenticated, or to the dashboard when the
 * user's role lacks the permission.
 */
export async function requireAdminPermission(
  permission: string,
): Promise<AdminAccess> {
  const session = await getSession();

  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  if (!hasPermission(session.role, permission)) {
    redirect("/admin/dashboard");
  }

  return {
    companyId: session.companyId!,
    userId: session.userId,
    role: session.role,
  };
}