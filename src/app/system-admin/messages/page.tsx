import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import {
  SystemMailboxView,
  SerializedSystemMessageThread,
  SimpleCompanyOption,
} from "@/components/system-admin/system-mailbox-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminMessagesPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM_ADMIN") {
    redirect("/system-admin");
  }

  const [initialCompanies, rawThreads] = await Promise.all([
    // Fetch only top 5 recent active companies as initial quick suggestions for AutoSearch
    prisma.company.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.messageThread.findMany({
      include: {
        company: { select: { name: true, code: true } },
        createdBy: { select: { name: true, email: true } },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true } },
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
  ]);

  const serializedThreads: SerializedSystemMessageThread[] = rawThreads.map((t) => {
    const lastMsg = t.messages[t.messages.length - 1];
    const unreadCount = t.messages.filter((m) => !m.isRead && m.senderId !== session.userId).length;

    return {
      id: t.id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      companyId: t.companyId,
      companyName: t.company?.name || null,
      companyCode: t.company?.code || null,
      planUpgradeRequestId: t.planUpgradeRequestId,
      createdByName: t.createdBy.name,
      createdByEmail: t.createdBy.email,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      lastMessageAt: t.lastMessageAt.toISOString(),
      messagesCount: t.messages.length,
      unreadCount,
      lastMessageSnippet: lastMsg ? lastMsg.content : "",
      messages: t.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderEmail: m.sender.email,
        senderRole: m.sender.role.code,
        content: m.content,
        isInternalOnly: m.isInternalOnly,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments.map((a) => ({
          id: a.id,
          originalName: a.originalName,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          createdAt: a.createdAt.toISOString(),
        })),
      })),
    };
  });

  const simpleCompanies: SimpleCompanyOption[] = initialCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
  }));

  return (
    <SystemMailboxView
      threads={serializedThreads}
      initialCompanies={simpleCompanies}
      currentUserId={session.userId}
    />
  );
}
