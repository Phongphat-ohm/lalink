import { prisma } from "@/lib/database";
import {
  SecurityCenterView,
  SerializedSecurityEvent,
} from "@/components/system-admin/security-center-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminSecurityPage() {
  const [events, totalEvents, failedLogins] = await Promise.all([
    prisma.securityEvent.findMany({
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.securityEvent.count(),
    prisma.securityEvent.count({
      where: { eventType: { contains: "LOGIN" } },
    }),
  ]);

  const serializedEvents: SerializedSecurityEvent[] = events.map((ev) => ({
    id: ev.id,
    eventType: ev.eventType,
    severity: ev.severity,
    email: ev.email,
    companyName: ev.company?.name || null,
    ipAddress: ev.ipAddress,
    userAgent: ev.userAgent,
    details: ev.details,
    createdAt: ev.createdAt.toISOString(),
  }));

  return (
    <SecurityCenterView
      events={serializedEvents}
      stats={{
        totalEvents,
        failedLogins,
        rateLimitBlocks: 0,
        activeFirewallStatus: "ACTIVE",
      }}
    />
  );
}
