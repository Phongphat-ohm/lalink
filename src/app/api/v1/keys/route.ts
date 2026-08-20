import { prisma } from '@/lib/database';
import { apiKeyAuth } from '@/lib/middleware/apiKeyAuth';
import { AuditLogger } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

/**
 * GET /api/v1/keys
 * Returns a list of API keys for the authenticated company.
 */
export async function GET(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const companyId = (req as any).headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json({ error: 'Missing company context' }, { status: 400 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isRevoked: true,
      createdAt: true,
      expiresAt: true,
      company: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keys);
}

/**
 * POST /api/v1/keys
 * Creates a new API key. Body { name: string, permissions: string[] }
 */
export async function POST(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const body = await req.json();
  const { name, permissions } = body;
  if (!name || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const apiKeyId = (req as any).headers.get('x-api-key-id');
  const creator = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
  const companyId = creator?.companyId;

  // Generate prefix and secret
  const keyPrefix = `lal_${randomBytes(4).toString('hex')}_`;
  const secret = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(secret).digest('hex');

  const newKey = await prisma.apiKey.create({
    data: {
      companyId,
      name,
      keyPrefix,
      keyHash,
      permissions,
    },
    select: { id: true, name: true, keyPrefix: true },
  });

  await AuditLogger.log({
    companyId: companyId || undefined,
    actorType: "SYSTEM",
    actorId: apiKeyId,
    action: "API_CREATE_KEY",
    resource: "ApiKey",
    resourceId: newKey.id,
    details: { name: newKey.name, keyPrefix: newKey.keyPrefix, permissions },
  });

  // Return the secret only once
  return NextResponse.json({ ...newKey, secret });
}

/**
 * DELETE /api/v1/keys
 * Body { id: string } – revokes the key.
 */
export async function DELETE(req: Request) {
  const authResult = await apiKeyAuth(req as any);
  if (authResult) return authResult;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Verify ownership via company header
  const companyId = (req as any).headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json({ error: 'Missing company context' }, { status: 400 });
  }

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (key.companyId !== companyId) {
    return NextResponse.json({ error: 'Forbidden: key belongs to another company' }, { status: 403 });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { isRevoked: true },
  });

  const callerApiKeyId = (req as any).headers.get('x-api-key-id');
  await AuditLogger.log({
    companyId,
    actorType: "SYSTEM",
    actorId: callerApiKeyId,
    action: "API_REVOKE_KEY",
    resource: "ApiKey",
    resourceId: id,
    details: { revokedKeyId: id, keyName: key.name },
  });

  return NextResponse.json({ success: true });
}
