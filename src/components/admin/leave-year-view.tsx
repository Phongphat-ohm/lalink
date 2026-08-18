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
import { CalendarRange, Plus, Loader2, RefreshCw, Check } from "lucide-react";

interface SerializedLeaveYear {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface LeaveYearViewProps {
  leaveYears: SerializedLeaveYear[];
  onSaveLeaveYear: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onActivateLeaveYear: (
    leaveYearId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteLeaveYear: (
    leaveYearId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onRunCarryForward: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function LeaveYearView({
  leaveYears,
  onSaveLeaveYear,
  onActivateLeaveYear,
  onDeleteLeaveYear,
  onRunCarryForward,
}: LeaveYearViewProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isCarryModalOpen, setIsCarryModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCarrying, setIsCarrying] = React.useState(false);

  const currentYear = new Date().getFullYear();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await onSaveLeaveYear(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleActivate(leaveYearId: string) {
    if (!confirm("เปิดใช้งานปีลานี้หรือไม่? (ปีลาอื่นจะถูกปิดใช้งาน)")) return;
    const res = await onActivateLeaveYear(leaveYearId);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleDelete(leaveYearId: string) {
    if (!confirm("ลบปีลานี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    const res = await onDeleteLeaveYear(leaveYearId);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleCarryForward(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCarrying(true);
    const formData = new FormData(e.currentTarget);
    const res = await onRunCarryForward(formData);
    setIsCarrying(false);

    if (res.success) {
      setIsCarryModalOpen(false);
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
            ปีลางาน (Leave Years)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดปีลางานขององค์กร (ปีปฏิทินหรือปีงบประมาณ) และดำเนินการสะสมวันลา
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setIsCarryModalOpen(true)}
            variant="outline"
            className="rounded-full h-9 text-xs font-semibold px-4"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            สะสมวันลา
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มปีลา
          </Button>
        </div>
      </div>

      {/* Leave Years Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <CalendarRange className="h-4 w-4 text-[#533afd] mr-2" />
            ปีลางานทั้งหมด ({leaveYears.length} ปี)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
              <tr>
                <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อปีลา</th>
                <th className="py-3.5 px-4 font-semibold">ปี</th>
                <th className="py-3.5 px-4 font-semibold">วันที่เริ่มต้น</th>
                <th className="py-3.5 px-4 font-semibold">วันที่สิ้นสุด</th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  สถานะ
                </th>
                <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]/70">
              {leaveYears.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#94a3b8]">
                    ยังไม่มีปีลางาน ใช้ปีปฏิทินโดยอัตโนมัติ เริ่มเพิ่มปีลาเพื่อกำหนดรอบวันลาขององค์กร
                  </td>
                </tr>
              )}
              {leaveYears.map((ly) => (
                <tr key={ly.id} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3.5 px-4 pl-5 font-medium text-[#0d253d]">
                    {ly.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#475569]">{ly.year}</td>
                  <td className="py-3.5 px-4 text-[#475569]">
                    {formatDate(ly.startDate)}
                  </td>
                  <td className="py-3.5 px-4 text-[#475569]">
                    {formatDate(ly.endDate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {ly.isActive ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ใช้งานอยู่
                      </Badge>
                    ) : (
                      <Badge variant="secondary">ปิดใช้งาน</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 pr-5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {!ly.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(ly.id)}
                          className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 rounded-full px-2.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          เปิดใช้งาน
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ly.id)}
                        className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                      >
                        ลบ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Leave Year Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มปีลางาน</DialogTitle>
            <DialogDescription>
              กำหนดรอบปีลาขององค์กร เช่น ปีงบประมาณเริ่มต้นเดือนตุลาคม
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">
                ชื่อปีลา
              </span>
              <Input
                id="ly-name"
                name="name"
                placeholder="เช่น ปีลา 2569"
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">
                ปี (ใช้เป็นคีย์สำหรับโควตาวันลา)
              </span>
              <Input
                id="ly-year"
                name="year"
                type="number"
                defaultValue={currentYear}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">
                  วันที่เริ่มต้น
                </span>
                <Input id="ly-start" name="startDate" type="date" required />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">
                  วันที่สิ้นสุด
                </span>
                <Input id="ly-end" name="endDate" type="date" required />
              </div>
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

      {/* Carry Forward Modal */}
      <Dialog open={isCarryModalOpen} onOpenChange={setIsCarryModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>สะสมวันลาคงเหลือ</DialogTitle>
            <DialogDescription>
              สะสมวันลาที่เหลือจากปีที่กำหนดไปยังปีถัดไป
              (ตามนโยบายการสะสมของประเภทการลาแต่ละประเภท)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCarryForward} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">
                  ปีต้นทาง
                </span>
                <Input
                  id="cf-source"
                  name="sourceYear"
                  type="number"
                  defaultValue={currentYear - 1}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">
                  ปีปลายทาง
                </span>
                <Input
                  id="cf-target"
                  name="targetYear"
                  type="number"
                  defaultValue={currentYear}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCarryModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isCarrying}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isCarrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "ดำเนินการสะสม"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}