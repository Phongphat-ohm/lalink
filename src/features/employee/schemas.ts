import { z } from "zod";
import { normalizeDateInput } from "@/lib/utils/date";

export const accountLinkingSchema = z.object({
  companyCode: z.string().min(1, "กรุณาระบุรหัสบริษัท").trim().toUpperCase(),
  employeeCode: z.string().min(1, "กรุณาระบุรหัสพนักงาน").trim().toUpperCase(),
  dateOfBirth: z
    .string()
    .min(1, "กรุณาระบุวันเดือนปีเกิด")
    .refine((val) => normalizeDateInput(val) !== null, {
      message: "รูปแบบวันเกิดไม่ถูกต้อง (เช่น 2538-05-15 หรือ 15/05/2538)",
    }),
  lineIdToken: z.string().optional(),
});

export type AccountLinkingInput = z.infer<typeof accountLinkingSchema>;
