"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Loader2 } from "lucide-react";

interface SerializedHoliday {
  id: string;
  date: string;
  name: string;
  weekday: string;
}

interface HolidayViewProps {
  holidays: SerializedHoliday[];
  year: number;
  onAddHoliday: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function HolidayView({
  holidays,
  year,
  onAddHoliday,
}: HolidayViewProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await onAddHoliday(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            ปฏิทินวันหยุดบริษัท ประจำปี {year} (Holidays)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            วันหยุดที่บันทึกไว้จะไม่ถูกคิดหักเป็นวันลาของพนักงานเมื่อมีการยื่นใบลา
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มวันหยุด
        </Button>
      </div>

      {/* Holidays List Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <CalendarDays className="h-4 w-4 text-[#533afd] mr-2" />
            รายการวันหยุด ({holidays.length} วัน)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
          >
            + เพิ่มวันหยุด
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {holidays.length === 0 ? (
            <div className="py-10 text-center text-[#64748d] text-xs">
              ยังไม่มีการกำหนดวันหยุดบริษัทสำหรับปี {year}
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">วันที่</th>
                  <th className="py-3.5 px-4 font-semibold">วันในสัปดาห์</th>
                  <th className="py-3.5 px-4 pr-5 font-semibold">
                    ชื่อวันหยุด
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {holidays.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-[#f6f9fc]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 pl-5 font-mono font-semibold text-[#533afd] tabular-nums">
                      {h.date}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748d]">{h.weekday}</td>
                    <td className="py-3.5 px-4 pr-5 font-semibold text-[#0d253d]">
                      {h.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Holiday Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CalendarDays className="h-5 w-5 text-[#533afd] mr-2" />
              เพิ่มวันหยุดบริษัท
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ระบุวันที่และชื่อวันหยุดพิเศษเพื่อยกเว้นการหักโควตาวันลา
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                วันที่หยุด <span className="text-[#ea2261]">*</span>
              </label>
              <div className="relative w-full min-w-0">
                <input
                  type="date"
                  name="date"
                  required
                  className="date-input-fixed block w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อวันหยุด <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                name="name"
                placeholder="เช่น วันสงกรานต์, วันแรงงานแห่งชาติ"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full h-9 px-4 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกวันหยุด"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
