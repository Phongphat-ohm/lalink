import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database';
import { createHash } from 'crypto';

/**
 * Middleware to authenticate API requests using either:
 * - `x-api-key: <key>` header
 * - `Authorization: Bearer <key>` header
 *
 * Returns a NextResponse with status 401 when the key is missing or invalid.
 * On success, passes metadata downstream via custom request headers:
 * - `x-api-key-id`: ID of the API Key
 * - `x-company-id`: ID of the bound company (if company-scoped)
 * - `x-api-key-permissions`: JSON string of permissions/scopes
 */
export async function apiKeyAuth(req: NextRequest): Promise<NextResponse | null> {
  let apiKeyValue = req.headers.get('x-api-key');

  if (!apiKeyValue) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      apiKeyValue = authHeader.substring(7).trim();
    }
  }

  if (!apiKeyValue) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing API key. Provide via x-api-key or Authorization: Bearer <key> header',
      },
      { status: 401 },
    );
  }

  // Compute SHA‑256 hash to compare with stored keyHash.
  const keyHash = createHash('sha256').update(apiKeyValue).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      company: {
        select: { id: true, name: true, status: true, enableApi: true },
      },
    },
  });

  if (!apiKey || apiKey.isRevoked) {
    return NextResponse.json(
      { success: false, error: 'Invalid or revoked API key' },
      { status: 401 },
    );
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: 'API key has expired' },
      { status: 401 },
    );
  }

  // Check company status and API feature permissions
  if (apiKey.company) {
    if (apiKey.company.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'องค์กรนี้ถูกระงับการใช้งานชั่วคราว (Company is suspended)',
        },
        { status: 403 },
      );
    }

    if (!apiKey.company.enableApi) {
      return NextResponse.json(
        {
          success: false,
          error: 'องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน API กรุณาติดต่อ System Administrator เพื่อขอเปิดใช้งาน',
        },
        { status: 403 },
      );
    }
  }

  // Update lastUsedAt for audit asynchronously.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((err) => console.error('Failed to update apiKey lastUsedAt:', err));

  // Pass identifiers downstream
  req.headers.set('x-api-key-id', apiKey.id);
  req.headers.set('x-api-key-permissions', JSON.stringify(apiKey.permissions || []));
  if (apiKey.companyId) {
    req.headers.set('x-company-id', apiKey.companyId);
  }

  return null; // Continue processing.
}

/**
 * Checks if the authenticated API request has the required scope.
 * Accepts `*` (full access) or specific scope match.
 */
export function hasApiScope(req: Request, requiredScope: string): boolean {
  try {
    const permsHeader = (req as any).headers.get('x-api-key-permissions');
    if (!permsHeader) return true; // fallback
    const perms: string[] = JSON.parse(permsHeader);
    return perms.includes('*') || perms.includes(requiredScope);
  } catch {
    return false;
  }
}
