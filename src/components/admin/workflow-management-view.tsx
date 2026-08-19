"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Workflow,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  ArrowRight,
  PlusCircle,
  X,
} from "lucide-react";

export interface SerializedWorkflowStep {
  stepOrder: number;
  roleCode: string;
  name: string;
}

export interface SerializedWorkflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  leaveTypeId: string | null;
  leaveTypeName: string | null;
  steps: SerializedWorkflowStep[];
}

interface WorkflowManagementViewProps {
  workflows: SerializedWorkflow[];
  leaveTypes: { id: string; name: string }[];
  onSaveWorkflow: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onToggleWorkflow: (
    workflowId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteWorkflow: (
    workflowId: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "หัวหน้างาน (MANAGER)" },
  { value: "HR", label: "ฝ่ายบุคคล (HR)" },
  { value: "HR_ADMIN", label: "ผู้บริหาร HR (HR_ADMIN)" },
  { value: "COMPANY_ADMIN", label: "ผู้ดูแลระบบ (COMPANY_ADMIN)" },
];

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "หัวหน้างาน",
  HR: "ฝ่ายบุคคล",
  HR_ADMIN: "ผู้บริหาร HR",
  COMPANY_ADMIN: "ผู้ดูแลระบบ",
  ADMIN: "ผู้ดูแลระบบ",
};

export function WorkflowManagementView({
  workflows,
  leaveTypes,
  onSaveWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow,
}: WorkflowManagementViewProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SerializedWorkflow | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [steps, setSteps] = React.useState<{ roleCode: string; name: string }[]>([
    { roleCode: "MANAGER", name: "หัวหน้างานตรวจสอบ" },
  ]);

  function openAddModal() {
    setEditing(null);
    setSteps([{ roleCode: "MANAGER", name: "หัวหน้างานตรวจสอบ" }]);
    setIsAddModalOpen(true);
  }

  function openEditModal(workflow: SerializedWorkflow) {
    setEditing(workflow);
    setSteps(
      workflow.steps.map((s) => ({ roleCode: s.roleCode, name: s.name })),
    );
    setIsAddModalOpen(true);
  }

  function updateStep(
    index: number,
    patch: Partial<{ roleCode: string; name: string }>,
  ) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function addStep() {
    if (steps.length >= 6) return;
    setSteps((prev) => [...prev, { roleCode: "MANAGER", name: "" }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    if (editing) formData.set("id", editing.id);
    steps.forEach((step, index) => {
      formData.set(`stepRole_${index}`, step.roleCode);
      formData.set(`stepName_${index}`, step.name);
    });
    const res = await onSaveWorkflow(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditing(null);
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleToggle(workflowId: string) {
    const res = await onToggleWorkflow(workflowId);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleDelete(workflow: SerializedWorkflow) {
    if (
      !confirm(
        `ลบสายการอนุมัติ "${workflow.name}" หรือไม่? ใบลาที่ใช้สายนี้จะกลับไปใช้การอนุมัติขั้นตอนเดียว`,
      )
    ) {
      return;
    }
    const res = await onDeleteWorkflow(workflow.id);
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
            สายการอนุมัติ (Approval Workflows)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดลำดับการอนุมัติหลายขั้นตอน ตามบทบาท (หัวหน้างาน → HR →
            ผู้ดูแลระบบ) ใช้กับทุกประเภทการลาหรือเฉพาะบางประเภทก็ได้
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มสายการอนุมัติ
        </Button>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl">
          <CardContent className="p-10 text-center text-[#94a3b8] text-sm">
            ยังไม่มีสายการอนุมัติ ระบบจะใช้การอนุมัติขั้นตอนเดียว (ผู้อนุมัติคนแรก)
            จนกว่าจะตั้งค่าสายการอนุมัติ
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <Card
              key={wf.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden"
            >
              <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Workflow className="h-4 w-4 text-[#533afd] shrink-0" />
                  <CardTitle className="text-sm font-semibold text-[#0d253d] truncate">
                    {wf.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {wf.leaveTypeName ? (
                    <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 rounded-full text-[10px] py-0.5">
                      {wf.leaveTypeName}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px] py-0.5"
                    >
                      ทุกประเภท
                    </Badge>
                  )}
                  {wf.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ใช้งานอยู่
                    </Badge>
                  ) : (
                    <Badge variant="secondary">ปิดใช้งาน</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {wf.description && (
                  <p className="text-xs text-[#64748d] mb-3">
                    {wf.description}
                  </p>
                )}

                {/* Step chain */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {wf.steps.map((step, index) => (
                    <React.Fragment key={step.stepOrder}>
                      <div className="rounded-lg border border-[#533afd]/20 bg-[#f0f4ff] px-3 py-1.5 text-[11px]">
                        <span className="font-mono text-[#533afd] font-bold mr-1.5">
                          {step.stepOrder}
                        </span>
                        <span className="font-medium text-[#0d253d]">
                          {ROLE_LABELS[step.roleCode] ?? step.roleCode}
                        </span>
                        <span className="text-[#64748d]"> · {step.name}</span>
                      </div>
                      {index < wf.steps.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-[#94a3b8]" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(wf.id)}
                    className="h-7 text-xs text-[#533afd] hover:bg-[#f0f4ff] rounded-full px-2.5"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {wf.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(wf)}
                    className="h-7 text-xs text-[#475569] hover:bg-[#f6f9fc] rounded-full px-2.5"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(wf)}
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

      {/* Add / Edit Workflow Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขสายการอนุมัติ" : "เพิ่มสายการอนุมัติ"}
            </DialogTitle>
            <DialogDescription>
              กำหนดชื่อสายการอนุมัติและลำดับขั้นตอนตามบทบาทผู้อนุมัติ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">ชื่อสายการอนุมัติ</span>
              <Input
                id="wf-name"
                name="name"
                placeholder="เช่น สายอนุมัติทั่วไป: หัวหน้างาน → HR"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">คำอธิบาย (ไม่บังคับ)</span>
              <Input
                id="wf-desc"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">
                ประเภทการลา (เว้นว่าง = ใช้กับทุกประเภท)
              </span>
              <Select
                name="leaveTypeId"
                className="h-10"
                defaultValue={editing?.leaveTypeId ?? ""}
              >
                <option value="">-- ทุกประเภทการลา --</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748d] font-semibold">
                  ลำดับขั้นตอนการอนุมัติ
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  disabled={steps.length >= 6}
                  className="h-7 text-xs rounded-full px-2.5"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  เพิ่มขั้นตอน
                </Button>
              </div>
              <div className="space-y-2.5">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-xl border border-[#e3e8ee] p-2.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#533afd]/10 text-[#533afd] font-bold text-xs font-mono">
                      {index + 1}
                    </span>
                    <Select
                      value={step.roleCode}
                      onChange={(e) =>
                        updateStep(index, { roleCode: e.target.value })
                      }
                      className="h-8 text-xs"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={step.name}
                      onChange={(e) =>
                        updateStep(index, { name: e.target.value })
                      }
                      placeholder="เช่น หัวหน้างานตรวจสอบ"
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      disabled={steps.length <= 1}
                      className="h-7 w-7 text-[#ea2261] hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#64748d]">
                ลำดับขั้นตอนเริ่มจากซ้ายไปขวา — ต้องผ่านขั้นก่อนหน้าจึงถึงขั้นถัดไป
                ผู้อนุมัติในแต่ละขั้นต้องมีบทบาทตามที่กำหนด
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