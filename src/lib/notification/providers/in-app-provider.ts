import { prisma } from "@/lib/database";
import { NotificationChannel, NotificationStatus } from "@prisma/client";
import type { NotificationContext, NotificationProvider } from "./types";

/**
 * Persists an in-app notification record (channel = IN_APP) for the
 * recipient to read in the web portal / LIFF app.
 */
export class InAppProvider implements NotificationProvider {
  readonly name = "IN_APP";
  readonly channels: NotificationChannel[] = [NotificationChannel.IN_APP];

  async send(context: NotificationContext): Promise<void> {
    await prisma.notification.create({
      data: {
        companyId: context.companyId,
        recipientType: context.recipientType,
        recipientId: context.recipientId,
        channel: NotificationChannel.IN_APP,
        title: context.title,
        message: context.message,
        status: NotificationStatus.SENT,
        payload: (context.payload ?? undefined) as object | undefined,
        sentAt: new Date(),
      },
    });
  }
}