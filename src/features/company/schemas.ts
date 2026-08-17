import { z } from "zod";

export const companyRegisterSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "ชื่อบริษัทต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
      .trim(),
    companyCode: z
      .string()
      .min(3, "รหัสบริษัทต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
      .max(10, "รหัสบริษัทต้องไม่เกิน 10 ตัวอักษร")
      .regex(
        /^[A-Z0-9_-]+$/,
        "รหัสบริษัทต้องเป็นตัวพิมพ์ใหญ่ A-Z, ตัวเลข 0-9 เท่านั้น",
      )
      .trim()
      .toUpperCase(),
    contactEmail: z
      .string()
      .email("รูปแบบอีเมลติดต่อไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
    adminName: z
      .string()
      .min(2, "ชื่อผู้ดูแลระบบต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
      .trim(),
    adminEmail: z
      .string()
      .min(1, "กรุณากรอกอีเมลผู้ดูแลระบบ")
      .email("รูปแบบอีเมลไม่ถูกต้อง")
      .trim()
      .toLowerCase(),
    adminPassword: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว")
      .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type CompanyRegisterInput = z.infer<typeof companyRegisterSchema>;

export const createCompanyByAdminSchema = z.object({
  name: z.string().min(2, "ชื่อบริษัทต้องมีความยาวอย่างน้อย 2 ตัวอักษร").trim(),
  code: z
    .string()
    .min(3, "รหัสบริษัทต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
    .max(10, "รหัสบริษัทต้องไม่เกิน 10 ตัวอักษร")
    .regex(
      /^[A-Z0-9_-]+$/,
      "รหัสบริษัทต้องเป็นตัวพิมพ์ใหญ่ A-Z, ตัวเลข 0-9 เท่านั้น",
    )
    .trim()
    .toUpperCase(),
  contactEmail: z
    .string()
    .email("รูปแบบอีเมลติดต่อไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
});

export type CreateCompanyByAdminInput = z.infer<
  typeof createCompanyByAdminSchema
>;
