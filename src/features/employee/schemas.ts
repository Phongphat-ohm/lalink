import { z } from "zod";

export const accountLinkingSchema = z.object({
  companyCode: z.string().min(1, "กรุณาระบุรหัสบริษัท").trim().toUpperCase(),
  employeeCode: z.string().min(1, "กรุณาระบุรหัสพนักงาน").trim().toUpperCase(),
  dateOfBirth: z
    .string()
    .min(1, "กรุณาระบุวันเดือนปีเกิด")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "รูปแบบวันเกิดต้องเป็น ปี-เดือน-วัน (เช่น 1995-05-15)",
    ),
  lineIdToken: z.string().optional(),
});

export type AccountLinkingInput = z.infer<typeof accountLinkingSchema>;
