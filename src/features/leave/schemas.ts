import { z } from "zod";
import { LeavePeriod } from "@prisma/client";
import { parseThaiDateToCE, normalizeDateInput } from "@/lib/utils/date";

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, "กรุณาเลือกประเภทการลา"),
    startDate: z
      .string()
      .min(1, "กรุณาระบุวันที่เริ่มต้น")
      .refine((val) => parseThaiDateToCE(val) !== null, {
        message: "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง",
      }),
    endDate: z
      .string()
      .min(1, "กรุณาระบุวันที่สิ้นสุด")
      .refine((val) => parseThaiDateToCE(val) !== null, {
        message: "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง",
      }),
    startPeriod: z.nativeEnum(LeavePeriod).default(LeavePeriod.FULL_DAY),
    endPeriod: z.nativeEnum(LeavePeriod).default(LeavePeriod.FULL_DAY),
    hours: z.coerce
      .number()
      .min(0, "จำนวนชั่วโมงต้องไม่น้อยกว่า 0")
      .max(24, "จำนวนชั่วโมงต้องไม่เกิน 24")
      .optional()
      .default(0),
    reason: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      const start = parseThaiDateToCE(data.startDate);
      const end = parseThaiDateToCE(data.endDate);
      if (!start || !end) return false;
      return start <= end;
    },
    {
      message: "วันที่เริ่มต้นต้องมาก่อนหรือตรงกับวันที่สิ้นสุด",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const isHourly =
        data.startPeriod === LeavePeriod.HOURLY ||
        data.endPeriod === LeavePeriod.HOURLY;
      // Hourly leave must be requested within a single day
      if (isHourly) {
        const startNorm = normalizeDateInput(data.startDate);
        const endNorm = normalizeDateInput(data.endDate);
        return startNorm === endNorm;
      }
      return true;
    },
    {
      message: "การลาแบบรายชั่วโมงต้องอยู่ภายในวันเดียวเท่านั้น",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      const isHourly =
        data.startPeriod === LeavePeriod.HOURLY ||
        data.endPeriod === LeavePeriod.HOURLY;
      if (isHourly) {
        return Number(data.hours) > 0;
      }
      return true;
    },
    {
      message: "กรุณาระบุจำนวนชั่วโมงที่ต้องการลา",
      path: ["hours"],
    },
  );

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

export const cancelLeaveRequestSchema = z.object({
  leaveRequestId: z.string().min(1, "กรุณาระบุรหัสใบลาที่ต้องการยกเลิก"),
});
