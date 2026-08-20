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
  toggleCompanyStatusAction,
  createCompanySuperAdminAction,
  getAutoCompanyCodeAction,
  updateCompanySuperAdminAction,
  deleteCompanySuperAdminAction,
  getCompanyDetailAction,
} from "@/features/company";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Ban,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  CalendarCheck,
  Pencil,
  Trash2,
  Eye,
  CreditCard,
} from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedCompany {
  id: string;
  code: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  employeesCount: number;
  usersCount: number;
  leaveRequestsCount: number;
}

interface CompanyManagementTableProps {
  initialCompanies: SerializedCompany[];
}

export function CompanyManagementTable({
  initialCompanies,
}: CompanyManagementTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "SUSPENDED"
  >("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // 1. Create Company Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newCompanyCode, setNewCompanyCode] = React.useState("");
  const [isGeneratingCode, setIsGeneratingCode] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // 2. Edit Company Modal State
  const [editingCompany, setEditingCompany] = React.useState<SerializedCompany | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editTaxId, setEditTaxId] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // 3. View Detail State
  const [detailCompany, setDetailCompany] = React.useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  // 4. Status Toggle Dialog State
  const [toggleTarget, setToggleTarget] = React.useState<SerializedCompany | null>(null);
  const [isToggling, setIsToggling] = React.useState(false);

  // 5. Delete Company Dialog State
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedCompany | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const generateCode = React.useCallback(async () => {
    setIsGeneratingCode(true);
    const res = await getAutoCompanyCodeAction();
    setIsGeneratingCode(false);
    if (res.success && res.data) {
      setNewCompanyCode(res.data.code);
    }
  }, []);

  function handleOpenCreateModal() {
    setIsCreateModalOpen(true);
    setCreateError(null);
    generateCode();
  }

  function handleOpenEditModal(c: SerializedCompany) {
    setEditingCompany(c);
    setEditName(c.name);
    setEditEmail(c.contactEmail || "");
    setEditPhone(c.contactPhone || "");
    setEditTaxId("");
    setEditAddress("");
    setEditError(null);
  }

  async function handleOpenDetail(companyId: string) {
    setIsLoadingDetail(true);
    const res = await getCompanyDetailAction(companyId);
    setIsLoadingDetail(false);
    if (res.success && res.data) {
      setDetailCompany(res.data);
    } else {
      toast.error(res.message || "ไม่สามารถดึงข้อมูลได้");
    }
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCompanySuperAdminAction(null, formData);

    setIsCreating(false);

    if (result.success) {
      setIsCreateModalOpen(false);
      router.refresh();
    } else {
      setCreateError(result.message || "เกิดข้อผิดพลาดในการสร้างบริษัท");
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCompany) return;

    setIsUpdating(true);
    setEditError(null);

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("taxId", editTaxId);
    formData.append("email", editEmail);
    formData.append("phone", editPhone);
    formData.append("address", editAddress);

    const result = await updateCompanySuperAdminAction(editingCompany.id, formData);
    setIsUpdating(false);

    if (result.success) {
      setEditingCompany(null);
      router.refresh();
    } else {
      setEditError(result.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  }

  async function handleConfirmToggleStatus() {
    if (!toggleTarget) return;

    setIsToggling(true);
    const newStatus = toggleTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const result = await toggleCompanyStatusAction(toggleTarget.id, newStatus);
    setIsToggling(false);

    if (result.success) {
      setToggleTarget(null);
      router.refresh();
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteCompanySuperAdminAction(deleteTarget.id);
    setIsDeleting(false);

    if (result.success) {
      setDeleteTarget(null);
      toast.success(result.message || "ลบบริษัทเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถลบบริษัทได้");
    }
  }

  const filteredCompanies = initialCompanies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contactEmail &&
        c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการบริษัทและ Tenant ในระบบ
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ควบคุมสถานะการเปิดใช้งาน แก้ไขข้อมูลองค์กร และตรวจสอบรายละเอียดเชิงลึก
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-4 h-10 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> เพิ่มบริษัทใหม่
        </Button>
      </div>

      {/* Filter and Search Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, รหัส Tenant, อีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "ACTIVE"
                    ? "เปิดใช้งาน"
                    : "ระงับการใช้งาน"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Companies Data Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">Tenant Code</th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อบริษัท</th>
                  <th className="py-3.5 px-4 font-semibold">ข้อมูลติดต่อ</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 font-semibold">พนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">ใบลาทั้งหมด</th>
                  <th className="py-3.5 px-4 font-semibold">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#64748d]">
                      ไม่พบข้อมูลบริษัทตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                      <td className="py-3.5 px-4 pl-5 font-mono font-bold text-[#533afd] tabular-nums">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {c.contactEmail || "-"}
                        {c.contactPhone && (
                          <span className="block text-[11px]">{c.contactPhone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={c.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] rounded-full px-2.5 py-0.5"
                        >
                          {c.status === "ACTIVE" ? "เปิดใช้งาน" : "ระงับการใช้งาน"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d] tabular-nums font-mono">
                        {c.employeesCount} คน
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums font-mono">
                        {c.leaveRequestsCount} รายการ
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(c.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Detail Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(c.id)}
                            className="h-7 text-xs rounded-full px-2 text-[#0d253d] border-[#e3e8ee] hover:bg-[#f6f9fc]"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(c)}
                            className="h-7 text-xs rounded-full px-2 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10"
                            title="แก้ไขข้อมูล"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Toggle Status Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setToggleTarget(c)}
                            className={`h-7 text-xs rounded-full px-2.5 font-semibold ${
                              c.status === "ACTIVE"
                                ? "text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6]"
                                : "text-[#059669] border-[#059669]/30 hover:bg-[#ecfdf5]"
                            }`}
                          >
                            {c.status === "ACTIVE" ? (
                              <>
                                <Ban className="h-3 w-3 mr-1" /> ระงับ
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> เปิดใช้
                              </>
                            )}
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(c)}
                            className="h-7 w-7 p-0 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] rounded-full"
                            title="ลบบริษัท"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredCompanies.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* 1. Modal: สร้างบริษัทใหม่ */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent
          onClose={() => setIsCreateModalOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Building2 className="h-5 w-5 text-[#533afd] mr-2" />
              เพิ่มบริษัทใหม่ (Super Admin)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ระบบจะสร้างบริษัทพร้อมแผนกและนโยบายประเภทวันลาเริ่มต้นให้อัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อบริษัท <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                name="name"
                placeholder="เช่น บริษัท ลาลิ้งค์ สยาม จำกัด"
                required
                disabled={isCreating}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#0d253d]">
                  รหัสบริษัท (Tenant Code) <span className="text-[#ea2261]">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateCode}
                  disabled={isGeneratingCode || isCreating}
                  className="text-[11px] font-semibold text-[#533afd] hover:underline flex items-center cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${isGeneratingCode ? "animate-spin" : ""}`}
                  />
                  สุ่มรหัสใหม่
                </button>
              </div>
              <div className="relative">
                <Input
                  name="code"
                  value={newCompanyCode}
                  onChange={(e) => setNewCompanyCode(e.target.value.toUpperCase())}
                  placeholder="เช่น COM991"
                  required
                  disabled={isCreating}
                  className="h-10 rounded-xl font-mono uppercase font-bold text-[#533afd] text-xs pr-10"
                />
                <Sparkles className="h-4 w-4 text-[#533afd] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">อีเมลติดต่อ</label>
                <Input
                  name="contactEmail"
                  type="email"
                  placeholder="hr@company.com"
                  disabled={isCreating}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">เบอร์โทรศัพท์</label>
                <Input
                  name="contactPhone"
                  placeholder="02-xxx-xxxx"
                  disabled={isCreating}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                className="rounded-full h-9 px-4 text-xs font-medium"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> กำลังสร้าง...
                  </>
                ) : (
                  "บันทึกบริษัทใหม่"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: แก้ไขข้อมูลบริษัท */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent onClose={() => setEditingCompany(null)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Pencil className="h-5 w-5 text-[#533afd] mr-2" />
              แก้ไขข้อมูลบริษัท
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              รหัส Tenant: <span className="font-mono font-bold text-[#533afd]">{editingCompany?.code}</span>
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {editError}
            </div>
          )}

          <form onSubmit={handleUpdateSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อบริษัท <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={isUpdating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">เลขประจำตัวผู้เสียภาษี</label>
                <Input
                  value={editTaxId}
                  onChange={(e) => setEditTaxId(e.target.value)}
                  placeholder="13 หลัก"
                  disabled={isUpdating}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">เบอร์โทรศัพท์</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={isUpdating}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">อีเมลติดต่อ</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={isUpdating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">ที่อยู่บริษัท</label>
              <Textarea
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                rows={2}
                disabled={isUpdating}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCompany(null)}
                disabled={isUpdating}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal: ดูรายละเอียดบริษัทเชิงลึก (Tenant Details) */}
      <Dialog open={!!detailCompany} onOpenChange={(open) => !open && setDetailCompany(null)}>
        <DialogContent onClose={() => setDetailCompany(null)} className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Building2 className="h-5 w-5 text-[#533afd] mr-2" />
              รายละเอียดองค์กร ({detailCompany?.code})
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ข้อมูลเชิงลึก โครงสร้างองค์กร และสถานะบริการ
            </DialogDescription>
          </DialogHeader>

          {detailCompany && (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#0d253d] text-sm">{detailCompany.name}</span>
                  <Badge variant={detailCompany.status === "ACTIVE" ? "success" : "destructive"}>
                    {detailCompany.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#64748d] text-[11px]">
                  <div>อีเมล: {detailCompany.email || "-"}</div>
                  <div>โทร: {detailCompany.phone || "-"}</div>
                  <div>Tax ID: {detailCompany.taxId || "-"}</div>
                  <div>สร้างเมื่อ: {new Date(detailCompany.createdAt).toLocaleDateString("th-TH")}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white border border-[#e3e8ee]">
                  <span className="text-[11px] text-[#64748d]">พนักงานทั้งหมด</span>
                  <p className="text-lg font-bold font-mono text-[#0d253d] mt-0.5">
                    {detailCompany.employeesCount} คน
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e3e8ee]">
                  <span className="text-[11px] text-[#64748d]">ผู้ดูแลระบบ</span>
                  <p className="text-lg font-bold font-mono text-[#533afd] mt-0.5">
                    {detailCompany.usersCount} บัญชี
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#e3e8ee]">
                  <span className="text-[11px] text-[#64748d]">คำขอลาทั้งหมด</span>
                  <p className="text-lg font-bold font-mono text-[#059669] mt-0.5">
                    {detailCompany.leaveRequestsCount} รายการ
                  </p>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="p-3 rounded-xl bg-white border border-[#e3e8ee]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0d253d] flex items-center">
                    <CreditCard className="h-4 w-4 mr-1.5 text-[#533afd]" /> SaaS Subscription:
                  </span>
                  {detailCompany.subscription ? (
                    <span className="font-bold font-mono text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full">
                      {detailCompany.subscription.planName} ({detailCompany.subscription.status})
                    </span>
                  ) : (
                    <span className="text-[#ea2261] font-semibold">ยังไม่มี Plan</span>
                  )}
                </div>
              </div>

              {/* Departments */}
              <div className="space-y-1.5">
                <span className="font-semibold text-[#0d253d]">แผนกในองค์กร ({detailCompany.departments.length} แผนก):</span>
                <div className="flex flex-wrap gap-1.5">
                  {detailCompany.departments.map((d: any) => (
                    <span key={d.id} className="bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-1 rounded-lg text-[11px] text-[#0d253d]">
                      {d.name} {d.code && <span className="text-[#64748d]">({d.code})</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-2 border-t border-[#e3e8ee]">
            <Button
              type="button"
              onClick={() => setDetailCompany(null)}
              className="rounded-full text-xs h-9 px-5 bg-[#0d253d] text-white"
            >
              ปิดหน้าต่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Alert Dialog: ยืนยันการเปลี่ยนสถานะบริษัท */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              {toggleTarget?.status === "ACTIVE" ? (
                <>
                  <Ban className="h-5 w-5 mr-2 text-[#ea2261]" />
                  ยืนยันการระงับการใช้งานบริษัท?
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2 text-[#059669]" />
                  ยืนยันการเปิดใช้งานบริษัท?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะเปลี่ยนสถานะของบริษัท{" "}
              <strong className="text-[#0d253d]">{toggleTarget?.name}</strong> ({toggleTarget?.code}) เป็น{" "}
              <strong>
                {toggleTarget?.status === "ACTIVE"
                  ? "SUSPENDED (ระงับชั่วคราว ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้)"
                  : "ACTIVE (เปิดใช้งานปกติ)"}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isToggling} className="rounded-full text-xs">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              disabled={isToggling}
              className={`rounded-full text-white text-xs font-semibold ${
                toggleTarget?.status === "ACTIVE"
                  ? "bg-[#ea2261] hover:bg-[#d01750]"
                  : "bg-[#059669] hover:bg-[#047857]"
              }`}
            >
              {isToggling ? "กำลังดำเนินการ..." : "ยืนยันการเปลี่ยนสถานะ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 5. Alert Dialog: ยืนยันการลบบริษัท */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการลบบริษัทออกจากระบบ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการลบบริษัท <strong className="text-[#0d253d]">{deleteTarget?.name}</strong> ({deleteTarget?.code}) ใช่หรือไม่? ข้อมูลพนักงานและใบลาทั้งหมดของบริษัทนี้จะถูกลบถาวร
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
              {isDeleting ? "กำลังลบ..." : "ยืนยันการลบถาวร"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
