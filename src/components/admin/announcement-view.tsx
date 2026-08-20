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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  Building,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/features/notification/announcement-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedAnnouncement {
  id: string;
  title: string;
  content: string;
  targetGroup: string;
  branchId: string | null;
  departmentId: string | null;
  branchName: string | null;
  departmentName: string | null;
  isPublished: boolean;
  publishedAt: string;
}

export interface BranchOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

interface AnnouncementViewProps {
  announcements: SerializedAnnouncement[];
  branches: BranchOption[];
  departments: DepartmentOption[];
}

export function AnnouncementView({
  announcements,
  branches,
  departments,
}: AnnouncementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [targetGroupFilter, setTargetGroupFilter] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<SerializedAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<SerializedAnnouncement | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [targetGroup, setTargetGroup] = React.useState<
    "ALL" | "BRANCH" | "DEPARTMENT"
  >("ALL");
  const [branchId, setBranchId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("targetGroup", targetGroup);
    formData.append("branchId", branchId);
    formData.append("departmentId", departmentId);

    const result = editTarget
      ? await updateAnnouncementAction(editTarget.id, null, formData)
      : await createAnnouncementAction(null, formData);
    setIsLoading(false);

    if (result.success) {
      setIsCreateOpen(false);
      setEditTarget(null);
      setTitle("");
      setContent("");
      setTargetGroup("ALL");
      setBranchId("");
      setDepartmentId("");
      router.refresh();
    } else {
      setError(
        result.message ||
          (editTarget ? "เกิดข้อผิดพลาดในการแก้ไขประกาศ" : "เกิดข้อผิดพลาดในการสร้างประกาศ"),
      );
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsLoading(true);

    const result = await deleteAnnouncementAction(deleteTarget.id);
    setIsLoading(false);

    if (result.success) {
      setDeleteTarget(null);
      toast.success(result.message || "ลบประกาศเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถลบประกาศได้");
    }
  }

  const filteredAnnouncements = announcements.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(term) ||
      a.content.toLowerCase().includes(term) ||
      (a.branchName && a.branchName.toLowerCase().includes(term)) ||
      (a.departmentName && a.departmentName.toLowerCase().includes(term));

    const matchesGroup =
      targetGroupFilter === "ALL" || a.targetGroup === targetGroupFilter;

    return matchesSearch && matchesGroup;
  });

  const totalPages = Math.ceil(filteredAnnouncements.length / pageSize) || 1;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            ประกาศข่าวสารองค์กร (Announcements)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ส่งข้อมูลข่าวสารและประกาศสำคัญผ่าน LINE Bot และ Dashboard ไปยังพนักงาน
          </p>
        </div>

        <Button
          onClick={() => {
            setEditTarget(null);
            setTitle("");
            setContent("");
            setTargetGroup("ALL");
            setBranchId("");
            setDepartmentId("");
            setError(null);
            setIsCreateOpen(true);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> สร้างประกาศใหม่
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาหัวข้อประกาศ หรือเนื้อหา..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "ALL_EMPLOYEES", label: "ทุกคน" },
              { key: "BRANCH", label: "ตามสาขา" },
              { key: "DEPARTMENT", label: "ตามแผนก" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => {
                  setTargetGroupFilter(st.key === "ALL_EMPLOYEES" ? "ALL" : st.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  targetGroupFilter === (st.key === "ALL_EMPLOYEES" ? "ALL" : st.key)
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {paginatedAnnouncements.length === 0 ? (
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl p-12 text-center text-xs text-[#64748d]">
            ไม่พบประกาศข่าวสารตามเงื่อนไขที่ระบุ
          </Card>
        ) : (
          paginatedAnnouncements.map((a) => (
            <Card
              key={a.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden hover:border-[#533afd]/40 transition-colors"
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#0d253d]">
                      {a.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] rounded-full px-2 text-[#533afd] border-[#533afd]/30 bg-[#533afd]/5 font-semibold"
                    >
                      {a.targetGroup === "ALL"
                        ? "พนักงานทุกคน"
                        : a.targetGroup === "BRANCH"
                          ? `สาขา: ${a.branchName}`
                          : `แผนก: ${a.departmentName}`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#64748d] flex items-center tabular-nums">
                    <Calendar className="h-3 w-3 mr-1" /> เผยแพร่เมื่อ{" "}
                    {new Date(a.publishedAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditTarget(a);
                      setTitle(a.title);
                      setContent(a.content);
                      setTargetGroup(
                        a.targetGroup as "ALL" | "BRANCH" | "DEPARTMENT",
                      );
                      setBranchId(a.branchId || "");
                      setDepartmentId(a.departmentId || "");
                      setIsCreateOpen(true);
                      setError(null);
                    }}
                    className="h-8 w-8 text-[#533afd] hover:bg-[#ede9fe] rounded-full"
                    title="แก้ไขประกาศ"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(a)}
                    className="h-8 w-8 text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                    title="ลบประกาศ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                <div className="text-xs text-[#0d253d] whitespace-pre-wrap bg-[#f6f9fc] p-3 rounded-xl border border-[#e3e8ee]/80">
                  {a.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] p-2">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          totalItems={filteredAnnouncements.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create Announcement Modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent
          onClose={() => {
            setIsCreateOpen(false);
            setEditTarget(null);
          }}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Megaphone className="h-5 w-5 text-[#533afd] mr-2" />
              {editTarget ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดหัวข้อและกลุ่มเป้าหมายที่จะได้รับข้อความ
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
                หัวข้อประกาศ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                placeholder="เช่น ประกาศวันหยุดพิเศษประจำปี"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                กลุ่มเป้าหมาย (Audience)
              </label>
              <Select
                value={targetGroup}
                onChange={(e) =>
                  setTargetGroup(
                    e.target.value as "ALL" | "BRANCH" | "DEPARTMENT",
                  )
                }
                className="text-xs h-9 rounded-xl"
              >
                <option value="ALL">ทุกคนในบริษัท (All Employees)</option>
                <option value="BRANCH">เฉพาะสาขา (Specific Branch)</option>
                <option value="DEPARTMENT">
                  เฉพาะแผนก (Specific Department)
                </option>
              </Select>
            </div>

            {targetGroup === "BRANCH" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  เลือกสาขา <span className="text-[#ea2261]">*</span>
                </label>
                <Select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                  required
                >
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {targetGroup === "DEPARTMENT" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  เลือกแผนก <span className="text-[#ea2261]">*</span>
                </label>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                  required
                >
                  <option value="">-- เลือกแผนก --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เนื้อหาประกาศ <span className="text-[#ea2261]">*</span>
              </label>
              <textarea
                placeholder="พิมพ์ข้อความประกาศที่นี่..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#a8c3de]/60 focus:border-[#533afd] focus:outline-none min-h-[100px] resize-none"
                required
              />
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditTarget(null);
                }}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs h-9 px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                {editTarget ? "บันทึกการแก้ไข" : "เผยแพร่ประกาศ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d]">
              ยืนยันการลบประกาศ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบประกาศ &ldquo;{deleteTarget?.title}&rdquo; ออกจากระบบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isLoading}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
