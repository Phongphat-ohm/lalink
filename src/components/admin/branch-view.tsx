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
import {
  GitBranch,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
} from "@/features/organization/branch-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedBranch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  employeesCount: number;
  departmentsCount: number;
  createdAt: string;
}

interface BranchViewProps {
  branches: SerializedBranch[];
}

export function BranchView({ branches }: BranchViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isMainFilter, setIsMainFilter] = React.useState<"ALL" | "MAIN" | "BRANCH">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(6);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<SerializedBranch | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isMain, setIsMain] = React.useState(false);

  // Edit state
  const [editTarget, setEditTarget] = React.useState<SerializedBranch | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isEditLoading, setIsEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("isMain", isMain ? "true" : "false");

    const result = await createBranchAction(null, formData);
    setIsLoading(false);

    if (result.success) {
      setIsCreateOpen(false);
      setCode("");
      setName("");
      setAddress("");
      setPhone("");
      setIsMain(false);
      router.refresh();
    } else {
      setError(result.message || "เกิดข้อผิดพลาดในการสร้างสาขา");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsLoading(true);

    const result = await deleteBranchAction(deleteTarget.id);
    setIsLoading(false);

    if (result.success) {
      setDeleteTarget(null);
      toast.success(result.message || "ลบสาขาเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถลบสาขาได้");
    }
  }

  function openEdit(branch: SerializedBranch) {
    setEditTarget(branch);
    setCode(branch.code);
    setName(branch.name);
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setIsMain(branch.isMain);
    setEditError(null);
    setIsEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;

    setIsEditLoading(true);
    setEditError(null);

    const formData = new FormData();
    formData.append("id", editTarget.id);
    formData.append("code", code);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("isMain", isMain ? "true" : "false");

    const result = await updateBranchAction(null, formData);
    setIsEditLoading(false);

    if (result.success) {
      setIsEditOpen(false);
      setEditTarget(null);
      router.refresh();
    } else {
      setEditError(result.message || "เกิดข้อผิดพลาดในการแก้ไขสาขา");
    }
  }

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMain =
      isMainFilter === "ALL" ||
      (isMainFilter === "MAIN" && b.isMain) ||
      (isMainFilter === "BRANCH" && !b.isMain);

    return matchesSearch && matchesMain;
  });

  const totalPages = Math.ceil(filteredBranches.length / pageSize) || 1;
  const paginatedBranches = filteredBranches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการสาขา (Branches)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            จัดการสำนักงานใหญ่และสาขาย่อย พร้อมพิกัดสถานที่และการจัดกลุ่ม
          </p>
        </div>

        <Button
          onClick={() => {
            setCode("");
            setName("");
            setAddress("");
            setPhone("");
            setIsMain(false);
            setError(null);
            setIsCreateOpen(true);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> เพิ่มสาขาใหม่
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อสาขา, รหัส หรือที่อยู่..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "MAIN", "BRANCH"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setIsMainFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  isMainFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "MAIN"
                    ? "สำนักงานใหญ่"
                    : "สาขาย่อย"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branches Grid */}
      {paginatedBranches.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl p-12 text-center text-xs text-[#64748d]">
          ไม่พบข้อมูลสาขาตามเงื่อนไขที่ระบุ
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBranches.map((b) => (
            <Card
              key={b.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden hover:border-[#533afd]/40 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2 border-b border-[#e3e8ee]/60 bg-[#f6f9fc]/40 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full">
                    {b.code}
                  </span>
                  {b.isMain && (
                    <Badge className="bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] text-[10px] rounded-full px-2">
                      สำนักงานใหญ่
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {!b.isMain && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(b)}
                      className="h-7 w-7 text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                      title="ลบสาขา"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(b)}
                    className="h-7 w-7 text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                    title="แก้ไขสาขา"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm text-[#0d253d]">{b.name}</h3>

                <div className="space-y-1.5 text-xs text-[#64748d]">
                  {b.address && (
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#64748d] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{b.address}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#64748d] shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#e3e8ee]/70 flex items-center justify-between text-xs text-[#64748d]">
                  <span className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-[#533afd]" />{" "}
                    พนักงาน:
                  </span>
                  <span className="font-bold font-mono text-[#0d253d]">
                    {b.employeesCount} คน
                  </span>
                </div>
              </CardContent>
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
          pageSizeOptions={[6, 12, 24, 48]}
          totalItems={filteredBranches.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create Branch Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          onClose={() => setIsCreateOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Building2 className="h-5 w-5 text-[#533afd] mr-2" />
              เพิ่มสาขาใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกข้อมูลสาขาเพื่อจัดกลุ่มแผนกและพนักงาน
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
                รหัสสาขา (Branch Code) <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                placeholder="เช่น HQ, BKK01, CNX02"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-xs h-9 rounded-xl uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อสาขา <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                placeholder="เช่น สำนักงานใหญ่ สาทร"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ที่อยู่สาขา
              </label>
              <Input
                placeholder="ระบุที่ตั้งสาขา"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เบอร์โทรศัพท์สาขา
              </label>
              <Input
                placeholder="เช่น 02-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isMainCreate"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="rounded border-[#a8c3de] text-[#533afd] focus:ring-[#533afd]"
              />
              <label
                htmlFor="isMainCreate"
                className="text-xs font-medium text-[#0d253d] cursor-pointer"
              >
                กำหนดเป็นสำนักงานใหญ่ (Main Branch)
              </label>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
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
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent
          onClose={() => setIsEditOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Pencil className="h-5 w-5 text-[#533afd] mr-2" />
              แก้ไขข้อมูลสาขา
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ปรับปรุงรายละเอียดของสาขา
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {editError}
            </div>
          )}

          <form onSubmit={handleEdit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสสาขา (Branch Code) <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-xs h-9 rounded-xl uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อสาขา <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ที่อยู่สาขา
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เบอร์โทรศัพท์สาขา
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isMainEdit"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="rounded border-[#a8c3de] text-[#533afd] focus:ring-[#533afd]"
              />
              <label
                htmlFor="isMainEdit"
                className="text-xs font-medium text-[#0d253d] cursor-pointer"
              >
                กำหนดเป็นสำนักงานใหญ่ (Main Branch)
              </label>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isEditLoading}
                className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs h-9 px-4"
              >
                {isEditLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                บันทึกการแก้ไข
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d]">
              ยืนยันการลบสาขา?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบสาขา &ldquo;{deleteTarget?.name}&rdquo; ({deleteTarget?.code})
              ออกจากระบบ หากมีแผนกหรือพนักงานผูกอยู่จะไม่สามารถลบได้
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
