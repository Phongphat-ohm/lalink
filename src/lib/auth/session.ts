import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

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
 * Creates and sets the secure HttpOnly session cookie on the server.
 */
export async function createSession(
  payload: Omit<SessionPayload, "exp" | "iat">,
): Promise<string> {
  const token = await signSessionToken(payload);
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
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Destroys the current session by expiring the cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Graceful fallback
  }
}
