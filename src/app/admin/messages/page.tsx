import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { MailboxView, SerializedMessageThread } from "@/components/admin/mailbox-view";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getSession();
  if (!session || !session.companyId) {
    redirect("/admin/login");
  }

  const rawThreads = await prisma.messageThread.findMany({
    where: { companyId: session.companyId },
    include: {
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
  });

  const serializedThreads: SerializedMessageThread[] = rawThreads.map((t) => {
    const lastMsg = t.messages[t.messages.length - 1];
    const unreadCount = t.messages.filter((m) => !m.isRead && m.senderId !== session.userId).length;

    return {
      id: t.id,
      subject: t.subject,
      category: t.category,
      status: t.status,
      companyId: t.companyId,
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

  return (
    <MailboxView
      threads={serializedThreads}
      currentUserId={session.userId}
    />
  );
}
