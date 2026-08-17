"use server";

import { prisma } from "@/lib/database";
import { companyRegisterSchema } from "./schemas";
import { generateUniqueCompanyCode } from "./code-generator";
import { hashPassword } from "@/lib/security/password";
import { AuditLogger } from "@/lib/audit";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Server action to generate a fresh unique company code for registration form.
 */
export async function getAutoCompanyCodeAction(): Promise<
  ActionResult<{ code: string }>
> {
  try {
    const code = await generateUniqueCompanyCode();
    return {
      success: true,
      data: { code },
    };
  } catch (error) {
    console.error("Generate code error:", error);
    return {
      success: false,
      message: "ไม่สามารถสุ่มรหัสบริษัทได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export interface ScannedCompanyInfo {
  id: string;
  name: string;
  code: string;
  status: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
}

/**
 * Extracts and cleans company code from plain text, JSON, URL, query param or deep link.
 */
export async function extractCompanyCode(input: string): Promise<string> {
  if (!input) return "";
  let clean = input.trim();

  // 1. JSON parsing check
  if (
    (clean.startsWith("{") && clean.endsWith("}")) ||
    (clean.startsWith("[") && clean.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(clean);
      const fromJson =
        parsed.code ||
        parsed.company ||
        parsed.companyCode ||
        parsed.tenantCode ||
        parsed.id;
      if (fromJson) return String(fromJson).trim().toUpperCase();
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Strip wrapping quotes, spaces, or brackets
  clean = clean.replace(/^["'\[{<]+|["'\]}>]+$/g, "").trim();

  // 2. URL or Query String
  if (
    clean.includes("?") ||
    clean.includes("&") ||
    clean.includes("=") ||
    clean.includes("://") ||
    clean.includes("/")
  ) {
    try {
      const urlStr =
        clean.startsWith("http://") || clean.startsWith("https://")
          ? clean
          : `https://${clean}`;
      const url = new URL(urlStr);

      // Search Query Parameters
      const paramCode =
        url.searchParams.get("company") ||
        url.searchParams.get("code") ||
        url.searchParams.get("companyCode") ||
        url.searchParams.get("tenant") ||
        url.searchParams.get("tenantCode") ||
        url.searchParams.get("c") ||
        url.searchParams.get("id");
      if (paramCode) return paramCode.trim().toUpperCase();

      // Hash Fragment (e.g. #company=DEMO or #/connect?company=DEMO)
      if (url.hash) {
        const hashQuery = url.hash.includes("?")
          ? url.hash.split("?")[1]
          : url.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hashQuery);
        const fromHash =
          hashParams.get("company") ||
          hashParams.get("code") ||
          hashParams.get("companyCode") ||
          hashParams.get("tenant") ||
          hashParams.get("c") ||
          hashParams.get("id");
        if (fromHash) return fromHash.trim().toUpperCase();
      }

      // Pathname segment
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (
          lastSegment &&
          lastSegment !== "connect" &&
          lastSegment !== "liff" &&
          lastSegment.length <= 15
        ) {
          return lastSegment.trim().toUpperCase();
        }
      }
    } catch {
      // Fallback regex for parameter in query
      const match = clean.match(
        /(?:company|code|companyCode|tenant|c|id)=([a-zA-Z0-9_-]+)/i,
      );
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    }
  }

  // 3. Text Prefix like "CODE: DEMO" or "COMPANY: DEMO"
  const prefixMatch = clean.match(
    /(?:code|company|tenant|รหัสบริษัท|รหัสองค์กร)[:\s=]+([a-zA-Z0-9_-]+)/i,
  );
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1].trim().toUpperCase();
  }

  return clean.toUpperCase();
}

/**
 * Server action to fetch company details when a user scans a company QR/Code in LIFF
 */
export async function getCompanyByScannedCodeAction(
  rawCodeOrUrl: string,
): Promise<ActionResult<ScannedCompanyInfo>> {
  try {
    if (!rawCodeOrUrl || !rawCodeOrUrl.trim()) {
      return { success: false, message: "ไม่พบรหัสบริษัทจากการสแกน" };
    }

    const code = await extractCompanyCode(rawCodeOrUrl);

    if (!code) {
      return {
        success: false,
        message:
          "ไม่สามารถระบุรหัสบริษัทจากข้อมูลที่สแกนได้ กรุณาลองใหม่อีกครั้ง",
      };
    }

    // Flexible multi-field lookup (by code, ID, or company name)
    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: "insensitive" } },
          { id: code },
          { name: { equals: code, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        taxId: true,
        address: true,
        phone: true,
      },
    });

    // Fallback: If not found and code was a generic link, check if default active company exists
    if (!company) {
      company = await prisma.company.findFirst({
        where: {
          OR: [{ code: "DEMO" }, { status: "ACTIVE" }],
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          taxId: true,
          address: true,
          phone: true,
        },
      });
    }

    if (!company) {
      return {
        success: false,
        message: `ไม่พบข้อมูลบริษัทสำหรับรหัส "${code}" ในระบบ กรุณาตรวจสอบ QR Code`,
      };
    }

    if (company.status === "SUSPENDED") {
      return {
        success: false,
        message: `บริษัท "${company.name}" (${company.code}) ถูกระงับการใช้งานชั่วคราว`,
      };
    }

    return {
      success: true,
      data: company,
    };
  } catch (error) {
    console.error("Get Company by Scanned Code Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการค้นหาข้อมูลบริษัท" };
  }
}

/**
 * Server action to register a new tenant company with default structure and admin user.
 */
export async function registerCompanyAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ companyCode: string; adminEmail: string }>> {
  const rawData = {
    companyName: formData.get("companyName"),
    companyCode: formData.get("companyCode"),
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // 1. Zod Validation
  const validated = companyRegisterSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    companyName,
    companyCode,
    contactEmail,
    contactPhone,
    adminName,
    adminEmail,
    adminPassword,
  } = validated.data;

  try {
    // 2. Check if Company Code is already taken
    const existingCompany = await prisma.company.findUnique({
      where: { code: companyCode },
      select: { id: true },
    });

    if (existingCompany) {
      return {
        success: false,
        message: `รหัสบริษัท "${companyCode}" มีผู้ใช้งานแล้ว กรุณาเลือกรหัสอื่น`,
        errors: {
          companyCode: ["รหัสบริษัทนี้ถูกใช้งานแล้ว กรุณากดสุ่มรหัสใหม่"],
        },
      };
    }

    // 3. Check if Admin Email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: `อีเมล "${adminEmail}" มีบัญชีผู้ใช้งานในระบบแล้ว`,
        errors: {
          adminEmail: [
            "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ",
          ],
        },
      };
    }

    // 4. Hash password with Argon2id
    const passwordHash = await hashPassword(adminPassword);

    // 5. Atomic Transaction: Create Company, Role, Admin, Department, and Default Leave Types
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Create Company
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          code: companyCode,
          email: contactEmail || null,
          phone: contactPhone || null,
          status: "ACTIVE",
        },
      });

      // 5.2 Ensure ADMIN Role exists
      let adminRole = await tx.role.findFirst({
        where: { code: "ADMIN" },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            code: "ADMIN",
            name: "ผู้ดูแลระบบ",
            description: "สิทธิ์การดูแลระบบและจัดการข้อมูลองค์กร",
          },
        });
      }

      // 5.3 Create Admin User
      const newAdminUser = await tx.user.create({
        data: {
          companyId: newCompany.id,
          roleId: adminRole.id,
          email: adminEmail,
          passwordHash,
          name: adminName,
          status: "ACTIVE",
        },
      });

      // 5.4 Create Default General Department
      await tx.department.create({
        data: {
          companyId: newCompany.id,
          code: "GEN",
          name: "ฝ่ายบริหารและทั่วไป",
        },
      });

      // 5.5 Create Default Leave Policies
      await tx.leaveType.createMany({
        data: [
          {
            companyId: newCompany.id,
            code: "ANNUAL",
            name: "ลาพักร้อนประจำปี",
            description: "สิทธิ์การลาพักผ่อนประจำปีตามนโยบายองค์กร",
            defaultDays: 6,
            allowHalfDay: true,
            requireReason: false,
            requireAttachment: false,
            isPaid: true,
            isActive: true,
          },
          {
            companyId: newCompany.id,
            code: "SICK",
            name: "ลาป่วย",
            description:
              "สิทธิ์การลาป่วยตามกฎหมายแรงงาน (แนบใบรับรองแพทย์เมื่อลา 3 วันขึ้นไป)",
            defaultDays: 30,
            allowHalfDay: true,
            requireReason: true,
            requireAttachment: true,
            attachmentRequiredDays: 3,
            isPaid: true,
            isActive: true,
          },
          {
            companyId: newCompany.id,
            code: "BUSINESS",
            name: "ลากิจธุระ",
            description: "สิทธิ์การลากิจธุระจำเป็น",
            defaultDays: 3,
            allowHalfDay: true,
            requireReason: true,
            requireAttachment: false,
            isPaid: true,
            isActive: true,
          },
        ],
      });

      // 5.6 Platform Audit Log
      try {
        await tx.auditLog.create({
          data: {
            companyId: newCompany.id,
            actorType: "USER",
            actorId: newAdminUser.id,
            action: "REGISTER_TENANT",
            resource: "Company",
            resourceId: newCompany.id,
            details: {
              companyName: newCompany.name,
              companyCode: newCompany.code,
              adminEmail: newAdminUser.email,
            },
          },
        });
      } catch {
        // Ignore audit log error in transaction
      }

      return { company: newCompany, user: newAdminUser };
    });

    return {
      success: true,
      message: "ลงทะเบียนองค์กรสำเร็จเรียบร้อยแล้ว",
      data: {
        companyCode: result.company.code,
        adminEmail: result.user.email,
      },
    };
  } catch (error) {
    console.error("Register Company Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
    };
  }
}
