import type { ActorType, NotificationChannel } from "@prisma/client";

/**
 * Context passed to notification providers describing one notification.
 */
export interface NotificationContext {
  companyId: string;
  recipientType: ActorType;
  recipientId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  payload?: unknown;
  lineUserId?: string | null;
}

/**
 * Contract every notification provider must implement.
 * Future providers (Email, SMS) can be added without touching callers.
 */
export interface NotificationProvider {
  readonly name: string;
  readonly channels: NotificationChannel[];
  send(context: NotificationContext): Promise<void>;
}
