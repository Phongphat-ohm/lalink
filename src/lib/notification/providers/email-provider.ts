import { NotificationChannel } from "@prisma/client";
import type { NotificationContext, NotificationProvider } from "./types";

/**
 * Email provider placeholder.
 *
 * Phase 3 will add an SMTP/Resend integration. Until then, email
 * notifications are dropped (non-blocking) rather than failing the
 * caller.
 */
export class EmailProvider implements NotificationProvider {
  readonly name = "EMAIL";
  readonly channels: NotificationChannel[] = [NotificationChannel.EMAIL];

  async send(_context: NotificationContext): Promise<void> {
    // Email delivery not implemented yet.
  }
}