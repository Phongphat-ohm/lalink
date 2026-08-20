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
  Search,
  AlertCircle,
} from "lucide-react";
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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(6);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SerializedWorkflow | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedWorkflow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
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
      toast.success(res.message || "บันทึกสายการอนุมัติสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึกสายการอนุมัติ");
    }
  }

  async function handleToggle(workflowId: string) {
    const res = await onToggleWorkflow(workflowId);
    if (res.success) {
      toast.success(res.message || "เปลี่ยนสถานะสายการอนุมัติสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถเปลี่ยนสถานะสายการอนุมัติได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await onDeleteWorkflow(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setDeleteTarget(null);
      toast.success(res.message || "ลบสายการอนุมัติสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบสายการอนุมัติได้");
    }
  }

  const filteredWorkflows = workflows.filter((wf) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      wf.name.toLowerCase().includes(term) ||
      (wf.description && wf.description.toLowerCase().includes(term)) ||
      (wf.leaveTypeName && wf.leaveTypeName.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && wf.isActive) ||
      (statusFilter === "INACTIVE" && !wf.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredWorkflows.length / pageSize) || 1;
  const paginatedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            สายการอนุมัติ (Approval Workflows)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดลำดับขั้นการอนุมัติใบลา (เช่น หัวหน้างาน &rarr; ฝ่ายบุคคล)
            จำแนกตามประเภทการลาได้
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

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อสายการอนุมัติ, ประเภทการลา..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "ACTIVE"
                    ? "ใช้งานอยู่"
                    : "ปิดใช้งาน"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflows List */}
      {paginatedWorkflows.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl">
          <CardContent className="p-10 text-center text-[#94a3b8] text-sm">
            ไม่พบสายการอนุมัติที่ตรงกับเงื่อนไข
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedWorkflows.map((wf) => (
            <Card
              key={wf.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
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
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-[#e3e8ee] flex items-center justify-end gap-1.5">
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
                    onClick={() => setDeleteTarget(wf)}
                    className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    ลบ
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] p-2">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[6, 12, 24]}
          totalItems={filteredWorkflows.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Workflow Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              {editing ? "แก้ไขสายการอนุมัติ" : "เพิ่มสายการอนุมัติใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดขั้นตอนและบทบาทของผู้มีอำนาจอนุมัติคำขอลาในแต่ละลำดับ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อสายการอนุมัติ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                name="name"
                defaultValue={editing?.name ?? ""}
                placeholder="เช่น สายอนุมัติ 2 ขั้นตอน (หัวหน้า & HR)"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                คำอธิบาย
              </label>
              <Input
                name="description"
                defaultValue={editing?.description ?? ""}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ประเภทการลาที่ใช้
              </label>
              <Select
                name="leaveTypeId"
                defaultValue={editing?.leaveTypeId ?? ""}
                className="h-9 rounded-xl text-xs"
              >
                <option value="">-- ใช้กับทุกประเภทการลา (Default) --</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="border-t border-[#e3e8ee] pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#0d253d]">
                  ลำดับขั้นการอนุมัติ (เรียงตามลำดับ 1 &rarr; {steps.length})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  disabled={steps.length >= 6}
                  className="h-7 text-xs text-[#533afd] hover:bg-[#f0f4ff] rounded-full px-2.5"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  เพิ่มขั้นตอน
                </Button>
              </div>

              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-[#f6f9fc] p-2.5 text-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#533afd] text-white font-mono font-bold text-xs">
                      {idx + 1}
                    </span>

                    <Select
                      value={step.roleCode}
                      onChange={(e) =>
                        updateStep(idx, { roleCode: e.target.value })
                      }
                      className="h-8 rounded-lg text-xs flex-1"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>

                    <Input
                      placeholder="ชื่อขั้นตอน เช่น หัวหน้าตรวจ"
                      value={step.name}
                      onChange={(e) =>
                        updateStep(idx, { name: e.target.value })
                      }
                      className="h-8 rounded-lg text-xs flex-1"
                    />

                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(idx)}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isSaving && (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                )}
                บันทึกสายการอนุมัติ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการลบสายการอนุมัติ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบสายการอนุมัติ &ldquo;{deleteTarget?.name}&rdquo; ออกจากระบบ คำขอลาในอนาคตจะใช้ค่าเริ่มต้น
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isDeleting && (
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