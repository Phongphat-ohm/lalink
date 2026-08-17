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
      message: "ไม่สามารถสุ่มรหัสบริษัทได้ กรุณาระบุรหัสด้วยตนเอง",
    };
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
