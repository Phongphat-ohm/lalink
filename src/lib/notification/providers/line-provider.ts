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
    const record = await prisma.notification.create({
      data: {
        companyId: context.companyId,
        recipientType: context.recipientType,
        recipientId: context.recipientId,
        channel: NotificationChannel.LINE,
        title: context.title,
        message: context.message,
        status: NotificationStatus.SENT,
        payload: (context.payload ?? undefined) as object | undefined,
        sentAt: new Date(),
      },
    });

    // Send LINE Push message if the recipient is linked
    if (context.lineUserId) {
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