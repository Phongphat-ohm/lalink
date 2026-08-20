import { prisma } from "@/lib/database";
import { AuditLogsView } from "@/components/system-admin/audit-logs-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminAuditLogsPage() {
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      company: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serializedLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    resource: log.resource,
    actorType: log.actorType,
    actorId: log.actorId,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
    company: log.company ? { name: log.company.name, code: log.company.code } : null,
  }));

  return <AuditLogsView logs={serializedLogs} />;
}
