"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Plus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  createPlanAction,
  updatePlanAction,
  togglePlanStatusAction,
  deletePlanAction,
} from "@/features/subscription";

export interface SerializedPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxEmployees: number;
  maxAdmins: number;
  priceMonthly: string;
  priceYearly: string;
  isActive: boolean;
  activeSubscriptionsCount: number;
  createdAt: string;
}

interface PlanManagementViewProps {
  plans: SerializedPlan[];
}

export function PlanManagementView({ plans }: PlanManagementViewProps) {
  const router = useRouter();

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<SerializedPlan | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Fields
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [maxEmployees, setMaxEmployees] = React.useState("20");
  const [maxAdmins, setMaxAdmins] = React.useState("2");
  const [priceMonthly, setPriceMonthly] = React.useState("0");
  const [priceYearly, setPriceYearly] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedPlan | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  function openCreateModal() {
    setEditingPlan(null);
    setCode("");
    setName("");
    setDescription("");
    setMaxEmployees("20");
    setMaxAdmins("2");
    setPriceMonthly("0");
    setPriceYearly("0");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(p: SerializedPlan) {
    setEditingPlan(p);
    setCode(p.code);
    setName(p.name);
    setDescription(p.description || "");
    setMaxEmployees(p.maxEmployees.toString());
    setMaxAdmins(p.maxAdmins.toString());
    setPriceMonthly(p.priceMonthly);
    setPriceYearly(p.priceYearly);
    setIsActive(p.isActive);
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("maxEmployees", maxEmployees);
    formData.append("maxAdmins", maxAdmins);
    formData.append("priceMonthly", priceMonthly);
    formData.append("priceYearly", priceYearly);
    formData.append("isActive", isActive ? "true" : "false");

    let result;
    if (editingPlan) {
      result = await updatePlanAction(editingPlan.id, formData);
    } else {
      result = await createPlanAction(null, formData);
    }

    setIsSaving(false);

    if (result.success) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      setFormError(result.message || "เกิดข้อผิดพลาดในการบันทึกแพ็กเกจ");
    }
  }

  async function handleToggleStatus(p: SerializedPlan) {
    const result = await togglePlanStatusAction(p.id, !p.isActive);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deletePlanAction(deleteTarget.id);
    setIsDeleting(false);

    if (result.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถลบแพ็กเกจได้");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการแพ็กเกจ SaaS (Plans & Pricing)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดระดับแพ็กเกจ โควตาพนักงาน/แอดมิน ราคา และ Feature Flags สำหรับทุกองค์กร
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> สร้างแพ็กเกจใหม่
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.id}
            className={`border bg-white shadow-xs rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
              p.isActive ? "border-[#e3e8ee]" : "border-[#ea2261]/20 bg-[#fff5f5]/30 opacity-80"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full">
                      {p.code}
                    </span>
                    <Badge variant={p.isActive ? "success" : "destructive"} className="text-[10px] rounded-full">
                      {p.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-bold text-[#0d253d] mt-2">{p.name}</h2>
                  <p className="text-xs text-[#64748d] mt-1 line-clamp-2">
                    {p.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="mt-4 pt-3 border-t border-[#e3e8ee]/70">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold font-mono text-[#0d253d]">
                    ฿{Number(p.priceMonthly).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#64748d]">/ เดือน</span>
                  {Number(p.priceYearly) > 0 && (
                    <span className="text-[11px] text-[#059669] font-semibold ml-2">
                      (฿{Number(p.priceYearly).toLocaleString()} / ปี)
                    </span>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#f6f9fc]">
                  <span className="text-[#64748d] flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-[#533afd]" /> โควตาพนักงานสูงสุด:
                  </span>
                  <span className="font-bold text-[#0d253d] font-mono">{p.maxEmployees} คน</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#f6f9fc]">
                  <span className="text-[#64748d] flex items-center">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-[#059669]" /> โควตาผู้ดูแลระบบ:
                  </span>
                  <span className="font-bold text-[#0d253d] font-mono">{p.maxAdmins} บัญชี</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#f6f9fc]">
                  <span className="text-[#64748d]">องค์กรที่ใช้งานอยู่:</span>
                  <span className="font-bold text-[#533afd] font-mono">{p.activeSubscriptionsCount} บริษัท</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-[#e3e8ee] flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(p)}
                className="h-8 text-xs rounded-full px-3 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10 font-semibold"
              >
                <Pencil className="h-3 w-3 mr-1" /> แก้ไข
              </Button>

              <div className="flex items-center space-x-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(p)}
                  className={`h-8 text-xs rounded-full px-3 font-semibold ${
                    p.isActive ? "text-[#ea2261] border-[#fecdd3]" : "text-[#059669] border-[#a7f3d0]"
                  }`}
                >
                  {p.isActive ? "ปิดใช้" : "เปิดใช้"}
                </Button>

                {p.activeSubscriptionsCount === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(p)}
                    className="h-8 w-8 p-0 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CreditCard className="h-5 w-5 text-[#533afd] mr-2" />
              {editingPlan ? "แก้ไขแพ็กเกจ SaaS" : "สร้างแพ็กเกจ SaaS ใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดรายละเอียดโควตาและอัตราค่าบริการของแพ็กเกจ
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  รหัสแพ็กเกจ (Code) <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="เช่น PRO, ENTERPRISE"
                  required
                  disabled={isSaving || !!editingPlan}
                  className="h-9 rounded-xl font-mono uppercase text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อแพ็กเกจ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น Business Pro"
                  required
                  disabled={isSaving}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">คำอธิบายแพ็กเกจ</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียดสิทธิประโยชน์..."
                rows={2}
                disabled={isSaving}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">โควตาพนักงานสูงสุด (คน)</label>
                <Input
                  type="number"
                  min={1}
                  value={maxEmployees}
                  onChange={(e) => setMaxEmployees(e.target.value)}
                  required
                  disabled={isSaving}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">โควตาแอดมินสูงสุด (บัญชี)</label>
                <Input
                  type="number"
                  min={1}
                  value={maxAdmins}
                  onChange={(e) => setMaxAdmins(e.target.value)}
                  required
                  disabled={isSaving}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">ราคาต่อเดือน (บาท)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  required
                  disabled={isSaving}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">ราคาต่อปี (บาท)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                  required
                  disabled={isSaving}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
              />
              <label htmlFor="isActiveCheck" className="text-xs text-[#0d253d] font-medium cursor-pointer">
                เปิดให้องค์กรเลือกใช้งานได้ทันที (Active)
              </label>
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกแพ็กเกจ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการลบแพ็กเกจ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการลบแพ็กเกจ <strong className="text-[#0d253d]">{deleteTarget?.name}</strong> ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนคืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} className="rounded-full text-xs">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs font-semibold"
            >
              {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
