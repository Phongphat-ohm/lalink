import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/database";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "lalink_session";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "fallback-secret-for-development-change-in-production-at-least-32-chars";

const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  companyId: string | null;
  role: string;
  employeeId?: string;
  type: "USER" | "EMPLOYEE";
  sessionId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Signs and generates a JWT session token.
 */
export async function signSessionToken(
  payload: Omit<SessionPayload, "exp" | "iat">,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 * Note: This only verifies the JWT signature/expiry. Revocation is
 * checked separately in `getSession()` via the `UserSession` DB record.
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Persists a server-side session record so sessions can be revoked.
 * Only USER-type sessions are tracked (employee LIFF sessions have no
 * `User` record to attach to).
 */
async function persistUserSession(
  payload: Omit<SessionPayload, "exp" | "iat">,
): Promise<string | undefined> {
  if (payload.type !== "USER" || !payload.userId) {
    return undefined;
  }

  const tokenHash = createHash("sha256")
    .update(randomBytes(48).toString("hex"))
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000,
  );

  try {
    const session = await prisma.userSession.create({
      data: {
        userId: payload.userId,
        tokenHash,
        expiresAt,
      },
      select: { id: true },
    });
    return session.id;
  } catch {
    // If the DB is unavailable, degrade gracefully (JWT-only session).
    return undefined;
  }
}

/**
 * Creates and sets the secure HttpOnly session cookie on the server.
 */
export async function createSession(
  payload: Omit<SessionPayload, "exp" | "iat">,
): Promise<string> {
  const sessionId = await persistUserSession(payload);
  const token = await signSessionToken({
    ...payload,
    ...(sessionId ? { sessionId } : {}),
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return token;
}

/**
 * Retrieves and validates the current active session from server cookies.
 * For USER sessions with a `sessionId`, also verifies the DB record is
 * not revoked and has not expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    // Server-side revocation check (only for tracked USER sessions)
    if (payload.type === "USER" && payload.sessionId) {
      try {
        const dbSession = await prisma.userSession.findUnique({
          where: { id: payload.sessionId },
          select: { isRevoked: true, expiresAt: true },
        });

        if (!dbSession || dbSession.isRevoked) return null;
        if (dbSession.expiresAt < new Date()) return null;
      } catch {
        // Fail closed on DB errors to avoid validating revoked sessions.
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Destroys the current session: revokes the server-side record (if any)
 * and expires the cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const session = await getSession();
    if (session?.sessionId && session.type === "USER") {
      await prisma.userSession.updateMany({
        where: { id: session.sessionId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
  } catch {
    // Graceful fallback
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Graceful fallback
  }
}