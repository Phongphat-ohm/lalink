import { prisma } from "@/lib/database";
import { ActorType } from "@prisma/client";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "hash",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "lineidtoken",
  "secret",
  "apikey",
  "creditcard",
  "idcard",
  "citizenid",
  "pin",
  "otp",
  "authorization",
]);

/**
 * Recursively sanitize objects to prevent logging credentials/secrets.
 */
export function sanitizeAuditDetails(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditDetails(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");

    const isExactSensitive = SENSITIVE_KEYS.has(normalizedKey);
    const isSubstringSensitive =
      typeof value !== "object" &&
      Array.from(SENSITIVE_KEYS).some(
        (sk) => normalizedKey.includes(sk) && sk.length >= 4,
      );

    if (isExactSensitive || isSubstringSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export interface LogAuditParams {
  companyId?: string | null;
  actorType: ActorType;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogger {
  static async log(params: LogAuditParams): Promise<void> {
    try {
      const sanitizedDetails = params.details
        ? (sanitizeAuditDetails(params.details) as any)
        : null;

      await prisma.auditLog.create({
        data: {
          companyId: params.companyId,
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          details: sanitizedDetails,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      console.warn("AuditLogger error (non-blocking):", err);
    }
  }
}
