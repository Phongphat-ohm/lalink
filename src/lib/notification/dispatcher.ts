import type { NotificationChannel } from "@prisma/client";
import {
  EmailProvider,
  InAppProvider,
  LineProvider,
  type NotificationContext,
  type NotificationProvider,
} from "./providers";

/**
 * Routes a notification to every registered provider matching the
 * requested channel. Provider failures are isolated (non-blocking) so
 * one channel failing never breaks the primary business transaction.
 */
export class NotificationDispatcher {
  private readonly providers: NotificationProvider[];

  constructor(providers: NotificationProvider[] = []) {
    this.providers = providers;
  }

  /**
   * Builds the default dispatcher with LINE, In-App and Email providers.
   */
  static createDefault(): NotificationDispatcher {
    return new NotificationDispatcher([
      new LineProvider(),
      new InAppProvider(),
      new EmailProvider(),
    ]);
  }

  /**
   * Dispatches a notification context to matching providers.
   *
   * @param context  The notification to deliver.
   * @param channels Optional override of target channels. When omitted,
   *                 providers matching `context.channel` are used.
   */
  async dispatch(
    context: NotificationContext,
    channels?: NotificationChannel[],
  ): Promise<void> {
    const targets = channels ?? [context.channel];

    for (const provider of this.providers) {
      const matches = provider.channels.some((c) => targets.includes(c));
      if (!matches) continue;

      try {
        await provider.send({ ...context, channel: targets[0] });
      } catch (err) {
        // Isolate provider failures so other channels still deliver.
        console.warn(
          `[NotificationDispatcher] ${provider.name} failed (non-blocking):`,
          err,
        );
      }
    }
  }
}