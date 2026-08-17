"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createLeaveRequestAction } from "@/features/leave";
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Paperclip,
  Calendar,
} from "lucide-react";

export interface SerializedLeaveTypeOption {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  allowHalfDay: boolean;
  requireReason: boolean;
  requireAttachment: boolean;
  attachmentRequiredDays: number | null;
  isPaid: boolean;
  remainingDays?: number;
}

interface LeaveFormProps {
  leaveTypes: SerializedLeaveTypeOption[];
}

export function LeaveForm({ leaveTypes }: LeaveFormProps) {
  const router = useRouter();

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = React.useState<string>(
    leaveTypes[0]?.id || "",
  );
  const [startDate, setStartDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [startPeriod, setStartPeriod] = React.useState<string>("FULL_DAY");
  const [endPeriod, setEndPeriod] = React.useState<string>("FULL_DAY");
  const [reason, setReason] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  const selectedType = leaveTypes.find((lt) => lt.id === selectedLeaveTypeId);

  // Estimate total days
  const estimatedDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (day !== 0 && day !== 6) {
        count += 1;
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (count === 1) {
      if (startPeriod !== "FULL_DAY") count = 0.5;
    } else if (count > 1) {
      if (startPeriod !== "FULL_DAY") count -= 0.5;
      if (endPeriod !== "FULL_DAY") count -= 0.5;
    }

    return Math.max(0, count);
  }, [startDate, endDate, startPeriod, endPeriod]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await createLeaveRequestAction(null, formData);

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || "เกิดข้อผิดพลาดในการยื่นใบลา");
      if (result.errors) {
        setFieldErrors(result.errors);
      }
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      router.push("/liff/history");
    }, 1200);
  }

  return (
    <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
        <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
          <FileText className="h-4 w-4 text-[#533afd] mr-2" />
          แบบฟอร์มคำขอลางาน
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-4">
        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-[#0d253d]">
              ยื่นใบลาสำเร็จ!
            </h3>
            <p className="text-xs text-[#64748d]">
              ระบบได้ส่งใบลาของคุณไปยัง HR และผู้มีอำนาจอนุมัติเรียบร้อยแล้ว
            </p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
              {/* 1. ประเภทการลา */}
              <div className="min-w-0 space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="leaveTypeId"
                    className="text-xs font-semibold text-[#0d253d]"
                  >
                    ประเภทการลา <span className="text-[#ea2261]">*</span>
                  </label>
                  {selectedType?.remainingDays !== undefined && (
                    <span className="text-[11px] font-semibold text-[#533afd] font-mono tabular-nums">
                      คงเหลือ: {selectedType.remainingDays} วัน
                    </span>
                  )}
                </div>

                <Select
                  id="leaveTypeId"
                  name="leaveTypeId"
                  value={selectedLeaveTypeId}
                  onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="box-border h-10 w-full min-w-0 max-w-full text-xs sm:text-sm rounded-xl"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (โควตา {t.defaultDays} วัน)
                    </option>
                  ))}
                </Select>
                {fieldErrors.leaveTypeId && (
                  <p className="text-[11px] text-[#ea2261] font-medium">
                    {fieldErrors.leaveTypeId[0]}
                  </p>
                )}
              </div>

              {/* 2. วันที่เริ่มต้น */}
              <div className="min-w-0 space-y-1">
                <label
                  htmlFor="startDate"
                  className="flex items-center text-xs font-semibold text-[#0d253d]"
                >
                  <Calendar className="mr-1 h-3.5 w-3.5 text-[#64748d]" />
                  วันที่เริ่มต้นลา{" "}
                  <span className="text-[#ea2261] ml-0.5">*</span>
                </label>
                <div className="relative w-full min-w-0">
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    required
                    disabled={isLoading}
                    className="date-input-fixed block w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20"
                  />
                </div>
                {fieldErrors.startDate && (
                  <p className="text-[11px] text-[#ea2261] font-medium">
                    {fieldErrors.startDate[0]}
                  </p>
                )}
              </div>

              {/* 3. วันที่สิ้นสุด */}
              <div className="min-w-0 space-y-1">
                <label
                  htmlFor="endDate"
                  className="flex items-center text-xs font-semibold text-[#0d253d]"
                >
                  <Calendar className="mr-1 h-3.5 w-3.5 text-[#64748d]" />
                  วันที่สิ้นสุดลา{" "}
                  <span className="text-[#ea2261] ml-0.5">*</span>
                </label>
                <div className="relative w-full min-w-0">
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    disabled={isLoading}
                    className="date-input-fixed block w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20"
                  />
                </div>
                {fieldErrors.endDate && (
                  <p className="text-[11px] text-[#ea2261] font-medium">
                    {fieldErrors.endDate[0]}
                  </p>
                )}
              </div>

              {/* 4. ช่วงเวลา (เต็มวัน / ครึ่งวัน) */}
              {selectedType?.allowHalfDay && (
                <div className="grid grid-cols-2 gap-3 min-w-0">
                  <div className="min-w-0 space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      ช่วงเวลาวันเริ่ม
                    </label>
                    <Select
                      name="startPeriod"
                      value={startPeriod}
                      onChange={(e) => setStartPeriod(e.target.value)}
                      disabled={isLoading}
                      className="box-border h-10 w-full min-w-0 max-w-full text-xs rounded-xl"
                    >
                      <option value="FULL_DAY">เต็มวัน</option>
                      <option value="HALF_DAY_AM">ครึ่งวันเช้า</option>
                      <option value="HALF_DAY_PM">ครึ่งวันบ่าย</option>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      ช่วงเวลาวันสิ้นสุด
                    </label>
                    <Select
                      name="endPeriod"
                      value={endPeriod}
                      onChange={(e) => setEndPeriod(e.target.value)}
                      disabled={isLoading}
                      className="box-border h-10 w-full min-w-0 max-w-full text-xs rounded-xl"
                    >
                      <option value="FULL_DAY">เต็มวัน</option>
                      <option value="HALF_DAY_AM">ครึ่งวันเช้า</option>
                      <option value="HALF_DAY_PM">ครึ่งวันบ่าย</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* Calculated Days Preview Box */}
              <div className="rounded-xl border border-[#533afd]/30 bg-[#533afd]/5 p-3 flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 text-[#0d253d]">
                  <CalendarDays className="h-4 w-4 text-[#533afd]" />
                  <span className="text-xs font-medium">คำนวณวันลาสุทธิ:</span>
                </div>
                <span className="text-sm font-bold text-[#533afd] font-mono tabular-nums">
                  {estimatedDays} วัน (ไม่รวมวันหยุด)
                </span>
              </div>

              {/* 5. เหตุผลการลา */}
              <div className="min-w-0 space-y-1">
                <label
                  htmlFor="reason"
                  className="text-xs font-semibold text-[#0d253d]"
                >
                  เหตุผลการลา{" "}
                  {selectedType?.requireReason ? "*" : "(ระบุหรือไม่ก็ได้)"}
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลในการลางาน..."
                  className="flex w-full min-w-0 max-w-full rounded-xl border border-[#a8c3de]/60 bg-white p-3 text-xs placeholder:text-[#64748d]/60 focus-visible:outline-none focus-visible:border-[#533afd] focus-visible:ring-2 focus-visible:ring-[#533afd]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                />
                {fieldErrors.reason && (
                  <p className="text-[11px] text-[#ea2261] font-medium">
                    {fieldErrors.reason[0]}
                  </p>
                )}
              </div>

              {/* 6. เอกสารแนบ (Optional / Required by policy) */}
              <div className="min-w-0 space-y-1">
                <label className="text-xs font-semibold text-[#0d253d] flex items-center">
                  <Paperclip className="h-3.5 w-3.5 mr-1 text-[#64748d]" />
                  เอกสารแนบ / ใบรับรองแพทย์ (PDF, PNG, JPG ขนาดไม่เกิน 5MB)
                </label>
                <input
                  type="file"
                  name="attachment"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="w-full text-xs text-[#64748d] file:mr-2.5 file:py-1.5 file:px-3.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#533afd]/10 file:text-[#533afd] hover:file:bg-[#533afd]/20 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || estimatedDays <= 0}
                className="w-full bg-[#533afd] hover:bg-[#4434d4] h-11 text-sm font-semibold shadow-md rounded-full mt-3 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่งใบลา...
                  </>
                ) : (
                  `ยืนยันการยื่นใบลา (${estimatedDays} วัน)`
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
