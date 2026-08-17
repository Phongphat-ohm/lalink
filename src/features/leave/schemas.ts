import { z } from "zod";
import { LeavePeriod } from "@prisma/client";

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "กรุณาเลือกประเภทการลา"),
    startDate: z
      .string()
      .min(1, "กรุณาระบุวันที่เริ่มต้น")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
    endDate: z
      .string()
      .min(1, "กรุณาระบุวันที่สิ้นสุด")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
    startPeriod: z.nativeEnum(LeavePeriod).default(LeavePeriod.FULL_DAY),
    endPeriod: z.nativeEnum(LeavePeriod).default(LeavePeriod.FULL_DAY),
    reason: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "วันที่เริ่มต้นต้องมาก่อนหรือตรงกับวันที่สิ้นสุด",
      path: ["endDate"],
    },
  );

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const cancelLeaveRequestSchema = z.object({
  leaveRequestId: z.string().min(1, "กรุณาระบุรหัสใบลาที่ต้องการยกเลิก"),
});
