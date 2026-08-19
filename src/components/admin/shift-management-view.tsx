"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Plus, Loader2, Pencil, Trash2, Check } from "lucide-react";

export interface SerializedShiftEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface SerializedShift {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entries: SerializedShiftEntry[];
}

interface ShiftManagementViewProps {
  shifts: SerializedShift[];
  onSaveShift: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onToggleShift: (
    shiftId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteShift: (
    shiftId: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

const DAY_LABELS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

function formatSlot(entry: SerializedShiftEntry): string {
  if (!entry.isWorkingDay) return "วันหยุด";
  return `${entry.startTime} - ${entry.endTime}`;
}

export function ShiftManagementView({
  shifts,
  onSaveShift,
  onToggleShift,
  onDeleteShift,
}: ShiftManagementViewProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingShift, setEditingShift] = React.useState<SerializedShift | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  function openAddModal() {
    setEditingShift(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(shift: SerializedShift) {
    setEditingShift(shift);
    setIsAddModalOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    if (editingShift) formData.set("id", editingShift.id);
    const res = await onSaveShift(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditingShift(null);
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleToggle(shiftId: string) {
    const res = await onToggleShift(shiftId);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleDelete(shift: SerializedShift) {
    if (
      !confirm(
        `ลบกะทำงาน "${shift.name}" หรือไม่? ตารางทำงานที่อ้างอิงกะนี้จะกลับไปใช้เวลาตามที่กำหนดเอง`,
      )
    ) {
      return;
    }
    const res = await onDeleteShift(shift.id);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            กะทำงาน (Shifts)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดเวลาทำงานรายสัปดาห์สำหรับกะต่าง ๆ
            แล้วนำไปผูกกับตารางทำงานหรือพนักงานรายคนได้
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มกะทำงาน
        </Button>
      </div>

      {/* Shifts Grid */}
      {shifts.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl">
          <CardContent className="p-10 text-center text-[#94a3b8] text-sm">
            ยังไม่มีกะทำงาน สร้างกะแรกเพื่อกำหนดเวลาทำงานของทีม
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <Card
              key={shift.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden"
            >
              <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#533afd]" />
                  {shift.name}
                </CardTitle>
                {shift.isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ใช้งานอยู่
                  </Badge>
                ) : (
                  <Badge variant="secondary">ปิดใช้งาน</Badge>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {shift.description && (
                  <p className="text-xs text-[#64748d] mb-3">
                    {shift.description}
                  </p>
                )}
                <div className="space-y-1.5">
                  {shift.entries.map((entry) => (
                    <div
                      key={entry.dayOfWeek}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                        entry.isWorkingDay
                          ? "bg-[#f0f4ff] text-[#0d253d]"
                          : "bg-[#f6f9fc] text-[#94a3b8]"
                      }`}
                    >
                      <span className="font-medium">
                        {DAY_LABELS[entry.dayOfWeek]}
                      </span>
                      <span className="font-mono">
                        {formatSlot(entry)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(shift.id)}
                    className="h-7 text-xs text-[#533afd] hover:bg-[#f0f4ff] rounded-full px-2.5"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {shift.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(shift)}
                    className="h-7 text-xs text-[#475569] hover:bg-[#f6f9fc] rounded-full px-2.5"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(shift)}
                    className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    ลบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? "แก้ไขกะทำงาน" : "เพิ่มกะทำงาน"}
            </DialogTitle>
            <DialogDescription>
              กำหนดเวลาทำงานรายสัปดาห์ของกะ (เลือกวันทำงานและเวลาเริ่ม-สิ้นสุด)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">ชื่อกะทำงาน</span>
              <Input
                id="shift-name"
                name="name"
                placeholder="เช่น กะเช้า 08:00-16:00"
                defaultValue={editingShift?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">คำอธิบาย (ไม่บังคับ)</span>
              <Input
                id="shift-desc"
                name="description"
                placeholder="เช่น เวลาเบรก 12:00-13:00"
                defaultValue={editingShift?.description ?? ""}
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d] font-semibold">
                เวลาทำงานรายสัปดาห์
              </span>
              <div className="rounded-xl border border-[#e3e8ee] divide-y divide-[#e3e8ee]">
                {DAY_LABELS.map((label, index) => {
                  const entry = editingShift?.entries.find(
                    (e) => e.dayOfWeek === index,
                  );
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          name={`working_${index}`}
                          defaultChecked={entry ? entry.isWorkingDay : index !== 0 && index !== 6}
                          className="h-4 w-4 rounded border-[#a8c3de] text-[#533afd] focus:ring-[#533afd]/30"
                        />
                        <span className="text-xs font-medium text-[#0d253d] w-20">
                          {label}
                        </span>
                      </div>
                      <Input
                        type="time"
                        name={`start_${index}`}
                        defaultValue={entry?.startTime && entry.isWorkingDay ? entry.startTime : "09:00"}
                        className="h-8 w-28 text-xs"
                      />
                      <span className="text-[#94a3b8] text-xs">ถึง</span>
                      <Input
                        type="time"
                        name={`end_${index}`}
                        defaultValue={entry?.endTime && entry.isWorkingDay ? entry.endTime : "18:00"}
                        className="h-8 w-28 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#64748d]">
                การเลือก (tick) ช่องวันทำงาน จะใช้เวลาเริ่ม-สิ้นสุดของวันนั้นในการคำนวณลารายชั่วโมง
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}