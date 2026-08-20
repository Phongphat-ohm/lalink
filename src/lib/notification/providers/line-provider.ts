import { prisma } from "@/lib/database";
import { sendLinePushMessage } from "@/lib/line";
import { NotificationChannel, NotificationStatus } from "@prisma/client";
import type { NotificationContext, NotificationProvider } from "./types";

/**
 * Sends notifications through the LINE Messaging API and persists a
 * `Notification` record with channel = LINE.
 */
export class LineProvider implements NotificationProvider {
  readonly name = "LINE";
  readonly channels: NotificationChannel[] = [NotificationChannel.LINE];

  async send(context: NotificationContext): Promise<void> {
    // Check Global & Company-specific LINE Push Settings
    let isPushAllowed = true;
    try {
      const [globalSetting, company] = await Promise.all([
        prisma.systemSetting.findUnique({
          where: { key: "line_push_enabled" },
          select: { value: true },
        }),
        prisma.company.findUnique({
          where: { id: context.companyId },
          select: { enableLinePush: true },
        }),
      ]);

      const isGlobalEnabled = globalSetting ? globalSetting.value !== "false" : true;
      const isCompanyEnabled = company ? company.enableLinePush : true;

      isPushAllowed = isGlobalEnabled && isCompanyEnabled;
    } catch (e) {
      console.warn("Failed to check LINE push settings, defaulting to allowed:", e);
    }

    const record = await prisma.notification.create({
      data: {
        companyId: context.companyId,
        recipientType: context.recipientType,
        recipientId: context.recipientId,
        channel: NotificationChannel.LINE,
        title: context.title,
        message: context.message,
        status: isPushAllowed ? NotificationStatus.SENT : NotificationStatus.PENDING,
        payload: (context.payload ?? undefined) as object | undefined,
        sentAt: isPushAllowed ? new Date() : null,
      },
    });

    // Send LINE Push message if recipient is linked and push is enabled
    if (context.lineUserId && isPushAllowed) {
      const payload = context.payload;
      const messages = Array.isArray(payload)
        ? payload
        : payload
          ? [payload]
          : [];
      if (messages.length > 0) {
        await sendLinePushMessage(context.lineUserId, messages);
      }
    }
  }
}