import { createHash, timingSafeEqual } from 'crypto';
import type { Prisma } from '@prisma/client';

/**
 * Verify the HMAC signature sent by our server.
 * `signatureHeader` should be the value of the `x-webhook-signature` header.
 * The secret is the one stored in the subscription.
 */
export function verifySignature(
  signatureHeader: string,
  secret: string,
  payload: Prisma.InputJsonValue,
): boolean {
  const expected = createHash('sha256')
    .update(secret + JSON.stringify(payload))
    .digest('hex');

  // Use timingSafeEqual to avoid timing attacks.
  const bufA = Buffer.from(signatureHeader, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
