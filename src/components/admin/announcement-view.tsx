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
} from "lucide-react";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
} from "@/features/notification/announcement-actions";

export interface SerializedAnnouncement {
  id: string;
  title: string;
  content: string;
  targetGroup: string;
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
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
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

    const result = await createAnnouncementAction(null, formData);
    setIsLoading(false);

    if (result.success) {
      setIsCreateOpen(false);
      setTitle("");
      setContent("");
      setTargetGroup("ALL");
      setBranchId("");
      setDepartmentId("");
      router.refresh();
    } else {
      setError(result.message || "เกิดข้อผิดพลาดในการสร้างประกาศ");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsLoading(true);

    const result = await deleteAnnouncementAction(deleteTarget.id);
    setIsLoading(false);

    if (result.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถลบประกาศได้");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            ประกาศและข่าวสารองค์กร (Announcements)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            สร้างประกาศข่าวสาร วันหยุด หรือข้อมูลสำคัญแจ้งเตือนพนักงานผ่านระบบ
          </p>
        </div>

        <Button
          onClick={() => {
            setIsCreateOpen(true);
            setError(null);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> สร้างประกาศใหม่
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#e3e8ee] p-6 text-xs text-[#64748d]">
            ยังไม่มีประกาศในระบบ กดปุ่ม &ldquo;สร้างประกาศใหม่&rdquo;
            เพื่อเผยแพร่ข่าวสาร
          </div>
        ) : (
          announcements.map((a) => (
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

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(a)}
                  className="h-8 w-8 text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                  title="ลบประกาศ"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

      {/* Create Announcement Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          onClose={() => setIsCreateOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Megaphone className="h-5 w-5 text-[#533afd] mr-2" />
              สร้างประกาศใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกหัวข้อและเนื้อหาสำหรับแจ้งเตือนพนักงาน
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
                placeholder="เช่น แจ้งหยุดทำการช่วงปีใหม่, ประกาศปรับปรุงระบบ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                กลุ่มเป้าหมายผู้รับประกาศ
              </label>
              <Select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as any)}
                disabled={isLoading}
                className="h-9 rounded-xl text-xs"
              >
                <option value="ALL">
                  พนักงานทุกคนในบริษัท (All Employees)
                </option>
                <option value="BRANCH">เฉพาะสาขาที่กำหนด</option>
                <option value="DEPARTMENT">เฉพาะแผนกที่กำหนด</option>
              </Select>
            </div>

            {targetGroup === "BRANCH" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  เลือกสาขา
                </label>
                <Select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={isLoading}
                  className="h-9 rounded-xl text-xs"
                >
                  <option value="">-- กรุณาเลือกสาขา --</option>
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
                  เลือกแผนก
                </label>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isLoading}
                  className="h-9 rounded-xl text-xs"
                >
                  <option value="">-- กรุณาเลือกแผนก --</option>
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
                rows={4}
                placeholder="ระบุรายละเอียดประกาศ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-[#a8c3de]/60 p-2.5 text-xs focus:border-[#533afd] focus:outline-none"
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
                    กำลังเผยแพร่...
                  </>
                ) : (
                  "เผยแพร่ประกาศ"
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
              ยืนยันการลบประกาศ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการลบประกาศ &ldquo;{deleteTarget?.title}&rdquo; ใช่หรือไม่?
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
              {isLoading ? "กำลังลบ..." : "ลบประกาศ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
