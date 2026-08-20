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
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  superAdminResetUserPasswordAction,
} from "@/features/company";
import {
  createUserSuperAdminAction,
  updateUserSuperAdminAction,
  toggleUserStatusSuperAdminAction,
  deleteUserSuperAdminAction,
} from "@/features/user";
import {
  Users,
  Search,
  KeyRound,
  Loader2,
  CheckCircle2,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Ban,
} from "lucide-react";
import { UserStatus } from "@prisma/client";

export interface SerializedGlobalUser {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface AvailableRole {
  id: string;
  code: string;
  name: string;
}

export interface AvailableCompany {
  id: string;
  code: string;
  name: string;
}

interface UserManagementTableProps {
  initialUsers: SerializedGlobalUser[];
  availableRoles: AvailableRole[];
  availableCompanies: AvailableCompany[];
}

export function UserManagementTable({
  initialUsers,
  availableRoles,
  availableCompanies,
}: UserManagementTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");

  // 1. Create User State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("");
  const [createRoleId, setCreateRoleId] = React.useState(availableRoles[0]?.id || "");
  const [createCompanyId, setCreateCompanyId] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // 2. Edit User State
  const [editingUser, setEditingUser] = React.useState<SerializedGlobalUser | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRoleId, setEditRoleId] = React.useState("");
  const [editCompanyId, setEditCompanyId] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<UserStatus>(UserStatus.ACTIVE);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // 3. Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = React.useState<SerializedGlobalUser | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = React.useState<string | null>(null);
  const [resetError, setResetError] = React.useState<string | null>(null);

  // 4. Delete User State
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedGlobalUser | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  function openCreateModal() {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRoleId(availableRoles[0]?.id || "");
    setCreateCompanyId("");
    setCreateError(null);
    setIsCreateOpen(true);
  }

  function openEditModal(u: SerializedGlobalUser) {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoleId(u.role.id);
    setEditCompanyId(u.company?.id || "");
    setEditStatus(u.status as UserStatus);
    setEditError(null);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    const formData = new FormData();
    formData.append("name", createName);
    formData.append("email", createEmail);
    formData.append("password", createPassword);
    formData.append("roleId", createRoleId);
    if (createCompanyId) {
      formData.append("companyId", createCompanyId);
    }

    const result = await createUserSuperAdminAction(null, formData);
    setIsCreating(false);

    if (result.success) {
      setIsCreateOpen(false);
      router.refresh();
    } else {
      setCreateError(result.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน");
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    setEditError(null);

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("email", editEmail);
    formData.append("roleId", editRoleId);
    formData.append("companyId", editCompanyId || "");
    formData.append("status", editStatus);

    const result = await updateUserSuperAdminAction(editingUser.id, formData);
    setIsUpdating(false);

    if (result.success) {
      setEditingUser(null);
      router.refresh();
    } else {
      setEditError(result.message || "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้งาน");
    }
  }

  async function handleToggleStatus(u: SerializedGlobalUser) {
    const newStatus = u.status === "ACTIVE" ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    const result = await toggleUserStatusSuperAdminAction(u.id, newStatus);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteUserSuperAdminAction(deleteTarget.id);
    setIsDeleting(false);

    if (result.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถลบผู้ใช้งานได้");
    }
  }

  async function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetTargetUser) return;

    setIsResetting(true);
    setResetError(null);
    setResetSuccessMessage(null);

    const result = await superAdminResetUserPasswordAction(
      resetTargetUser.id,
      newPassword,
    );

    setIsResetting(false);

    if (result.success) {
      setResetSuccessMessage("รีเซ็ตรหัสผ่านสำเร็จ!");
      setTimeout(() => {
        setResetTargetUser(null);
        setNewPassword("");
        setResetSuccessMessage(null);
        router.refresh();
      }, 1500);
    } else {
      setResetError(result.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    }
  }

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company &&
        (u.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.company.code.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesRole = roleFilter === "ALL" || u.role.code === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            รายชื่อผู้ดูแลระบบทั้งหมด (Platform Admins)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            จัดการบัญชี Super Admin, Company Admin, HR และ Manager ข้ามทุกองค์กร
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> สร้างแอดมินใหม่
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, บริษัท..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#64748d]">สิทธิ์:</span>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-44"
            >
              <option value="ALL">ทุกสิทธิ์ (ทั้งหมด)</option>
              <option value="SYSTEM_ADMIN">Super Admin</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
              <option value="HR_ADMIN">HR Admin</option>
              <option value="HR">HR Officer</option>
              <option value="MANAGER">Manager</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 font-semibold">อีเมล</th>
                  <th className="py-3.5 px-4 font-semibold">สังกัดองค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">สิทธิ์ (Role)</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 font-semibold">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#64748d]">
                      ไม่พบข้อมูลผู้ใช้งานตามคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                      <td className="py-3.5 px-4 pl-5 font-bold text-[#0d253d]">{u.name}</td>
                      <td className="py-3.5 px-4 text-[#64748d]">{u.email}</td>
                      <td className="py-3.5 px-4">
                        {u.company ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-[#0d253d]">{u.company.name}</span>
                            <span className="font-mono text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full">
                              {u.company.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#533afd] font-semibold italic text-[11px]">
                            Platform Central
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={u.role.code === "SYSTEM_ADMIN" ? "default" : "outline"}
                          className="text-[10px] rounded-full px-2.5 py-0.5"
                        >
                          {u.role.name}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={u.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Edit User Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(u)}
                            className="h-7 text-xs rounded-full px-2 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10"
                            title="แก้ไขผู้ใช้"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Reset Password Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPassword("");
                              setResetError(null);
                              setResetSuccessMessage(null);
                            }}
                            className="h-7 text-xs rounded-full px-2 text-[#d97706] border-[#fde68a] hover:bg-[#fef3c7]"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>

                          {/* Toggle Status */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            className={`h-7 text-xs rounded-full px-2 font-semibold ${
                              u.status === "ACTIVE" ? "text-[#ea2261] border-[#fecdd3]" : "text-[#059669] border-[#a7f3d0]"
                            }`}
                            title={u.status === "ACTIVE" ? "ระงับบัญชี" : "เปิดใช้งาน"}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete User */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(u)}
                            className="h-7 w-7 p-0 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] rounded-full"
                            title="ลบผู้ใช้"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Modal: สร้างแอดมินใหม่ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Plus className="h-5 w-5 text-[#533afd] mr-2" />
              สร้างผู้ดูแลระบบใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดข้อมูลบัญชีผู้ใช้งานและสิทธิ์การเข้าถึง
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
                ชื่อ-นามสกุล <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                disabled={isCreating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                อีเมล <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                disabled={isCreating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสผ่านเริ่มต้น <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                type="password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                disabled={isCreating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">สิทธิ์ (Role)</label>
                <Select
                  value={createRoleId}
                  onChange={(e) => setCreateRoleId(e.target.value)}
                  className="h-9 rounded-xl text-xs w-full"
                >
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">สังกัดบริษัท</label>
                <Select
                  value={createCompanyId}
                  onChange={(e) => setCreateCompanyId(e.target.value)}
                  className="h-9 rounded-xl text-xs w-full"
                >
                  <option value="">Platform Central (ส่วนกลาง)</option>
                  {availableCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isCreating ? "กำลังสร้าง..." : "สร้างผู้ใช้งาน"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: แก้ไขผู้ใช้ */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent onClose={() => setEditingUser(null)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Pencil className="h-5 w-5 text-[#533afd] mr-2" />
              แก้ไขข้อมูลผู้ดูแลระบบ
            </DialogTitle>
          </DialogHeader>

          {editError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {editError}
            </div>
          )}

          <form onSubmit={handleUpdateSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">ชื่อ-นามสกุล</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={isUpdating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">อีเมล</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                disabled={isUpdating}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">สิทธิ์ (Role)</label>
                <Select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="h-9 rounded-xl text-xs w-full"
                >
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">สถานะบัญชี</label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="h-9 rounded-xl text-xs w-full"
                >
                  <option value="ACTIVE">ACTIVE (เปิดใช้งาน)</option>
                  <option value="INACTIVE">INACTIVE (ไม่ใช้งาน)</option>
                  <option value="SUSPENDED">SUSPENDED (ระงับชั่วคราว)</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">สังกัดบริษัท</label>
              <Select
                value={editCompanyId}
                onChange={(e) => setEditCompanyId(e.target.value)}
                className="h-9 rounded-xl text-xs w-full"
              >
                <option value="">Platform Central (ส่วนกลาง)</option>
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
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

      {/* 3. Reset Password Modal */}
      <Dialog
        open={!!resetTargetUser}
        onOpenChange={(open) => !open && setResetTargetUser(null)}
      >
        <DialogContent
          onClose={() => setResetTargetUser(null)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <KeyRound className="h-5 w-5 text-[#533afd] mr-2" />
              รีเซ็ตรหัสผ่านผู้ใช้งาน
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดรหัสผ่านใหม่ให้กับ{" "}
              <strong className="text-[#0d253d]">
                {resetTargetUser?.name}
              </strong>{" "}
              ({resetTargetUser?.email})
            </DialogDescription>
          </DialogHeader>

          {resetSuccessMessage && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ecfdf5] text-[#059669] text-xs font-semibold flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> {resetSuccessMessage}
            </div>
          )}

          {resetError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {resetError}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-3.5 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสผ่านใหม่ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                type="password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isResetting}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTargetUser(null)}
                disabled={isResetting}
                className="rounded-full h-9 px-4 text-xs font-medium"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isResetting}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกรหัสผ่านใหม่"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Delete User Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการลบผู้ใช้งาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการลบบัญชีผู้ใช้ <strong className="text-[#0d253d]">{deleteTarget?.name}</strong> ({deleteTarget?.email}) ใช่หรือไม่?
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
