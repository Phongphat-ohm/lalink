import { prisma } from '@/lib/database';
import { getDefaultJobQueue } from '@/lib/jobs';
import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';

/**
 * Enqueue a webhook dispatch job for each subscription interested in the event.
 * This function is called from application code when an event occurs.
 */
export async function dispatchEvent(eventName: string, payload: Prisma.InputJsonValue) {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      isActive: true,
      events: { has: eventName },
      company: { enableWebhook: true, status: "ACTIVE" },
    },
  });

  const queue = getDefaultJobQueue();
  for (const sub of subscriptions) {
    await queue.enqueue('webhookDispatch', {
      subscriptionId: sub.id,
      url: sub.url,
      secret: sub.secret,
      eventName,
      payload,
    });
  }
}

// Register the job handler (runs when the queue processes a job).
const queue = getDefaultJobQueue();
queue.register('webhookDispatch', async (data) => {
  const { subscriptionId, url, secret, eventName, payload } = data as {
    subscriptionId: string;
    url: string;
    secret: string;
    eventName: string;
    payload: Prisma.InputJsonValue;
  };

  const signature = createHash('sha256').update(secret + JSON.stringify(payload)).digest('hex');
  const body = JSON.stringify({ event: eventName, payload });
  let success = false;
  let responseStatus: number | undefined;
  let responseBody: string | undefined;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
      },
      body,
    });
    responseStatus = res.status;
    responseBody = await res.text();
    success = res.ok;
  } catch (err) {
    responseBody = (err as Error).message;
  }

  // Record the attempt.
  await prisma.webhookEventLog.create({
    data: {
      subscriptionId,
      eventName,
      payload,
      success,
      responseStatus,
      responseBody,
    },
  });

  return { success };
});
