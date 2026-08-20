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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CalendarRange, Plus, Loader2, RefreshCw, Check, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";

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
  const [activateTarget, setActivateTarget] = React.useState<SerializedLeaveYear | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedLeaveYear | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const currentYear = new Date().getFullYear() + 543;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await onSaveLeaveYear(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      toast.success(res.message || "บันทึกปีลางานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึกปีลางาน");
    }
  }

  async function handleActivateConfirm() {
    if (!activateTarget) return;
    setIsActionLoading(true);
    const res = await onActivateLeaveYear(activateTarget.id);
    setIsActionLoading(false);

    if (res.success) {
      setActivateTarget(null);
      toast.success(res.message || "เปิดใช้งานปีลางานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถเปิดใช้งานปีลางานได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    const res = await onDeleteLeaveYear(deleteTarget.id);
    setIsActionLoading(false);

    if (res.success) {
      setDeleteTarget(null);
      toast.success(res.message || "ลบปีลางานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบปีลางานได้");
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
      toast.success(res.message || "ดำเนินการสะสมวันลาสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการสะสมวันลา");
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
            ข้ามปีตามเงื่อนไขของแต่ละประเภทการลา
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCarryModalOpen(true)}
            className="rounded-full border-[#533afd]/30 text-[#533afd] hover:bg-[#533afd]/10 h-9 text-xs font-semibold px-4"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            สะสมวันลาข้ามปี
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

      {/* Leave Years Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <CalendarRange className="h-4 w-4 text-[#533afd] mr-2" />
            ปีลางานทั้งหมด ({leaveYears.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
              <tr>
                <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อปีลา</th>
                <th className="py-3.5 px-4 font-semibold">ปี</th>
                <th className="py-3.5 px-4 font-semibold">วันเริ่มต้น</th>
                <th className="py-3.5 px-4 font-semibold">วันสิ้นสุด</th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  สถานะ
                </th>
                <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]/70">
              {leaveYears.map((ly) => (
                <tr
                  key={ly.id}
                  className="hover:bg-[#f6f9fc]/70 transition-colors"
                >
                  <td className="py-3.5 px-4 pl-5 font-semibold text-[#0d253d]">
                    {ly.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#533afd] tabular-nums">
                    {ly.year}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748d] font-mono tabular-nums">
                    {formatDate(ly.startDate)}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748d] font-mono tabular-nums">
                    {formatDate(ly.endDate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {ly.isActive ? (
                      <Badge
                        variant="success"
                        className="text-[10px] rounded-full"
                      >
                        ใช้งานอยู่
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] rounded-full"
                      >
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 pr-5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {!ly.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivateTarget(ly)}
                          className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 rounded-full px-2.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          เปิดใช้งาน
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(ly)}
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
                  วันเริ่มต้น
                </span>
                <Input
                  id="ly-start"
                  name="startDate"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">
                  วันสิ้นสุด
                </span>
                <Input
                  id="ly-end"
                  name="endDate"
                  type="date"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="ly-active"
                name="isActive"
                type="checkbox"
                value="true"
                className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
              />
              <label
                htmlFor="ly-active"
                className="text-xs text-[#0d253d] cursor-pointer"
              >
                ตั้งเป็นปีลาที่ใช้งานอยู่ (Active Year)
              </label>
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

      {/* Activate Confirmation Dialog */}
      <AlertDialog
        open={!!activateTarget}
        onOpenChange={(open) => !open && setActivateTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Check className="h-5 w-5 text-emerald-600 mr-2" />
              ยืนยันการเปิดใช้งานปีลางาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะเปิดใช้งานปีลา &ldquo;{activateTarget?.name}&rdquo; ({activateTarget?.year}) 
              ระบบจะตั้งปีลานี้เป็นปีปัจจุบัน และปิดการใช้งานปีลาอื่นโดยอัตโนมัติ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isActionLoading}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateConfirm}
              disabled={isActionLoading}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4"
            >
              {isActionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันเปิดใช้งาน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการลบปีลางาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบปีลา &ldquo;{deleteTarget?.name}&rdquo; ออกจากระบบ การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isActionLoading}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isActionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}