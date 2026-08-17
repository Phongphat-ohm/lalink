import { getSession, SessionPayload } from "@/lib/auth/session";

export class UnauthorizedError extends Error {
  constructor(message = "กรุณาเข้าสู่ระบบก่อนดำเนินการ") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "คุณไม่มีสิทธิ์เข้าถึงหรือดำเนินการในส่วนนี้") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class TenantAccessError extends Error {
  constructor(
    message = "ไม่พบข้อมูลบริษัทหรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลของบริษัทนี้",
  ) {
    super(message);
    this.name = "TenantAccessError";
  }
}

export interface TenantContext {
  companyId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  type: "USER" | "EMPLOYEE";
  employeeId?: string;
}

export interface SystemAdminContext {
  userId: string;
  email: string;
  name: string;
  role: "SYSTEM_ADMIN";
  type: "USER";
  companyId: null;
}

/**
 * Resolves the Tenant Context strictly from the server-side session.
 * Rejects any client-provided companyId and ensures isolation.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  // System Admin doesn't belong to a single tenant, but if accessing tenant data, must specify context
  if (session.role === "SYSTEM_ADMIN" && !session.companyId) {
    throw new ForbiddenError(
      "ผู้ดูแลระบบส่วนกลางต้องระบุ Tenant Context ก่อนดำเนินการ",
    );
  }

  if (!session.companyId) {
    throw new TenantAccessError();
  }

  return {
    companyId: session.companyId,
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    type: session.type,
    employeeId: session.employeeId,
  };
}

/**
 * Resolves Platform Super Admin context.
 */
export async function requireSystemAdminContext(): Promise<SystemAdminContext> {
  const session = await getSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  if (session.role !== "SYSTEM_ADMIN") {
    throw new ForbiddenError(
      "เฉพาะผู้ดูแลระบบระดับแพลตฟอร์มเท่านั้นที่เข้าถึงได้",
    );
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: "SYSTEM_ADMIN",
    type: "USER",
    companyId: null,
  };
}

/**
 * Resolves optional session or tenant context without throwing.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    return await requireTenantContext();
  } catch {
    return null;
  }
}
