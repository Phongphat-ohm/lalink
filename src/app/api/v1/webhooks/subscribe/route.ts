import { prisma } from '@/lib/database';
import { apiKeyAuth } from '@/lib/middleware/apiKeyAuth';
import { AuditLogger } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

/**
 * GET /api/v1/webhooks/subscribe
 * Returns all webhook subscriptions for the authenticated company.
 */
export async function GET(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const apiKeyId = (req as any).headers.get('x-api-key-id');
  const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
  if (!apiKey) return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  if (!apiKey.companyId) {
    return NextResponse.json({ error: 'API key is not bound to a company' }, { status: 400 });
  }

  const subs = await prisma.webhookSubscription.findMany({
    where: { companyId: apiKey.companyId },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(subs);
}

/**
 * POST /api/v1/webhooks/subscribe
 * Body: { url: string, events: string[], isActive?: boolean }
 * Creates a new webhook subscription and returns the generated secret.
 */
export async function POST(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const apiKeyId = (req as any).headers.get('x-api-key-id');
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    include: { company: { select: { enableWebhook: true } } },
  });
  if (!apiKey) return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  if (!apiKey.companyId) {
    return NextResponse.json({ error: 'API key is not bound to a company' }, { status: 400 });
  }

  if (!apiKey.company?.enableWebhook) {
    return NextResponse.json(
      { error: 'องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน Webhook กรุณาติดต่อ System Administrator เพื่อขอเปิดใช้งาน' },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { url, events, isActive = true } = body;
  if (!url || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // generate a secret for HMAC signing
  const secret = randomBytes(32).toString('hex');
  const secretHash = createHash('sha256').update(secret).digest('hex');

  const sub = await prisma.webhookSubscription.create({
    data: {
      companyId: apiKey.companyId as string,
      url,
      secret: secretHash,
      events,
      isActive,
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
    },
  });

  await AuditLogger.log({
    companyId: apiKey.companyId as string,
    actorType: "SYSTEM",
    actorId: apiKeyId,
    action: "API_CREATE_WEBHOOK",
    resource: "WebhookSubscription",
    resourceId: sub.id,
    details: { url: sub.url, events: sub.events },
  });

  // Return the raw secret once (client must store it securely)
  return NextResponse.json({ ...sub, secret });
}

/**
 * DELETE /api/v1/webhooks/subscribe
 * Body: { id: string }
 * Deactivates (or deletes) a webhook subscription.
 */
export async function DELETE(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify ownership via API key's company
  const apiKeyId = (req as any).headers.get('x-api-key-id');
  const apiKey = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
  if (!apiKey) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

  const sub = await prisma.webhookSubscription.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  if (sub.companyId !== apiKey.companyId) {
    return NextResponse.json({ error: 'Forbidden: subscription belongs to another company' }, { status: 403 });
  }

  await prisma.webhookSubscription.delete({
    where: { id },
  });

  await AuditLogger.log({
    companyId: sub.companyId,
    actorType: "SYSTEM",
    actorId: apiKeyId,
    action: "API_DELETE_WEBHOOK",
    resource: "WebhookSubscription",
    resourceId: id,
    details: { url: sub.url, deletedId: id },
  });

  return NextResponse.json({ success: true });
}
