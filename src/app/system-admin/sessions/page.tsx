import { prisma } from "@/lib/database";
import {
  SessionManagementView,
  SerializedUserSession,
} from "@/components/system-admin/session-management-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminSessionsPage() {
  const sessions = await prisma.userSession.findMany({
    include: {
      user: {
        include: {
          company: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { lastActiveAt: "desc" },
    take: 100,
  });

  const serializedSessions: SerializedUserSession[] = sessions.map((s) => ({
    id: s.id,
    userName: s.user.name,
    userEmail: s.user.email,
    companyName: s.user.company?.name || null,
    companyCode: s.user.company?.code || null,
    device: s.device,
    browser: s.browser,
    os: s.os,
    ipAddress: s.ipAddress,
    isRevoked: s.isRevoked,
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  return <SessionManagementView sessions={serializedSessions} />;
}
