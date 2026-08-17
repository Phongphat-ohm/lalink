import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "lalink_session";
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "fallback-secret-for-development-change-in-production-at-least-32-chars";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);

interface SessionData {
  userId: string;
  email: string;
  name: string;
  companyId: string | null;
  role: string;
  type: "USER" | "EMPLOYEE";
}

async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifyToken(sessionCookie) : null;

  // 1. Admin Login Page Access
  if (pathname === "/admin/login") {
    if (session && session.type === "USER") {
      const redirectPath =
        session.role === "SYSTEM_ADMIN" ? "/system-admin" : "/admin/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect Admin Web Portal Routes (/admin/*)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || session.type !== "USER") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Protect System Admin Portal Routes (/system-admin/*)
  if (pathname.startsWith("/system-admin")) {
    if (!session || session.role !== "SYSTEM_ADMIN") {
      const targetUrl = session ? "/admin/dashboard" : "/admin/login";
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/system-admin/:path*"],
};
