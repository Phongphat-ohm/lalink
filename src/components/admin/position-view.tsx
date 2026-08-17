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
import { Briefcase, Plus, Trash2, Users, Loader2 } from "lucide-react";
import {
  createPositionAction,
  deletePositionAction,
} from "@/features/organization/position-actions";

export interface SerializedPositionItem {
  id: string;
  code: string | null;
  name: string;
  employeesCount: number;
  createdAt: string;
}

interface PositionViewProps {
  positions: SerializedPositionItem[];
}

export function PositionView({ positions }: PositionViewProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<SerializedPositionItem | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);

    const result = await createPositionAction(null, formData);
    setIsLoading(false);

    if (result.success) {
      setIsCreateOpen(false);
      setCode("");
      setName("");
      router.refresh();
    } else {
      setError(result.message || "เกิดข้อผิดพลาดในการสร้างตำแหน่ง");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsLoading(true);

    const result = await deletePositionAction(deleteTarget.id);
    setIsLoading(false);

    if (result.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถลบตำแหน่งได้");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการตำแหน่งงาน (Positions)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดตำแหน่งงานและระดับความรับผิดชอบของบุคลากร
          </p>
        </div>

        <Button
          onClick={() => {
            setIsCreateOpen(true);
            setError(null);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> เพิ่มตำแหน่งใหม่
        </Button>
      </div>

      {/* Positions Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">
                    รหัสตำแหน่ง
                  </th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อตำแหน่ง</th>
                  <th className="py-3.5 px-4 font-semibold">จำนวนพนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ยังไม่มีข้อมูลตำแหน่งงานในระบบ
                    </td>
                  </tr>
                ) : (
                  positions.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-bold text-[#533afd]">
                        {p.code || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-[#533afd]" />{" "}
                          {p.employeesCount} คน
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(p.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          className="h-7 w-7 text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                          title="ลบตำแหน่ง"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Position Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          onClose={() => setIsCreateOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Briefcase className="h-5 w-5 text-[#533afd] mr-2" />
              เพิ่มตำแหน่งงานใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกรหัสและชื่อตำแหน่งงาน
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสตำแหน่ง (Position Code)
              </label>
              <Input
                placeholder="เช่น DEV, HR-MGR, ACC"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="h-9 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อตำแหน่ง <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                placeholder="เช่น Software Engineer, HR Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isLoading}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกตำแหน่ง"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d]">
              ยืนยันการลบตำแหน่ง?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการลบตำแหน่ง &ldquo;{deleteTarget?.name}&rdquo; ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isLoading}
              className="rounded-full text-xs h-9 px-4"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="rounded-full bg-[#ea2261] text-white hover:bg-[#d91452] text-xs h-9 px-5 font-semibold"
            >
              {isLoading ? "กำลังลบ..." : "ลบตำแหน่ง"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
