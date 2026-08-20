import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  AdminAuditLogsView,
  SerializedAdminAuditLog,
} from "@/components/admin/admin-audit-logs-view";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.AUDIT_READ);

  const auditLogs = await prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serializedLogs: SerializedAdminAuditLog[] = auditLogs.map((l) => ({
    id: l.id,
    actorType: l.actorType,
    actorId: l.actorId,
    action: l.action,
    resource: l.resource,
    resourceId: l.resourceId,
    details: l.details,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt.toISOString(),
  }));

  return <AdminAuditLogsView logs={serializedLogs} />;
}
