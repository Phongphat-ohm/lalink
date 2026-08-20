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
import { Select } from "@/components/ui/select";
import { Users, UserPlus, Loader2, KeyRound, ShieldAlert, Search } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: string; code: string; name: string } | null;
  isSelf: boolean;
}

export interface SerializedRole {
  id: string;
  code: string;
  name: string;
}

interface UserManagementViewProps {
  users: SerializedUser[];
  roles: SerializedRole[];
  onCreateUser: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onUpdateUser: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onResetPassword: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function UserManagementView({
  users,
  roles,
  onCreateUser,
  onUpdateUser,
  onResetPassword,
}: UserManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<SerializedUser | null>(
    null,
  );
  const [resetTarget, setResetTarget] = React.useState<SerializedUser | null>(
    null,
  );
  const [isBusy, setIsBusy] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsBusy(true);
    const formData = new FormData(e.currentTarget);
    const res = await onCreateUser(formData);
    setIsBusy(false);

    if (res.success) {
      setIsAddModalOpen(false);
      toast.success(res.message || "สร้างผู้ใช้งานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน");
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setIsBusy(true);
    const formData = new FormData(e.currentTarget);
    formData.set("userId", editingUser.id);
    const res = await onUpdateUser(formData);
    setIsBusy(false);

    if (res.success) {
      setEditingUser(null);
      toast.success(res.message || "อัปเดตข้อมูลผู้ใช้งานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetTarget) return;
    setIsBusy(true);
    const formData = new FormData(e.currentTarget);
    formData.set("userId", resetTarget.id);
    const res = await onResetPassword(formData);
    setIsBusy(false);

    if (res.success) {
      setResetTarget(null);
      toast.success(res.message || "รีเซ็ตรหัสผ่านสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term);

    const matchesRole =
      roleFilter === "ALL" || (u.role && u.role.code === roleFilter);

    const matchesStatus =
      statusFilter === "ALL" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            ผู้ใช้สำหรับเข้าสู่ระบบ (System Users)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            จัดการบัญชีผู้ดูแล/HR/หัวหน้างานที่ใช้เข้าสู่ระบบหลังบ้านของบริษัท
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          เพิ่มผู้ใช้ใหม่
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#64748d]">บทบาท:</span>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl text-xs w-36"
              >
                <option value="ALL">ทุกบทบาท</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#64748d]">สถานะ:</span>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl text-xs w-32"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="ACTIVE">ใช้งานอยู่</option>
                <option value="INACTIVE">ปิดใช้งาน</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <Users className="h-4 w-4 text-[#533afd] mr-2" />
            ผู้ใช้ทั้งหมด ({filteredUsers.length} บัญชี)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อ</th>
                  <th className="py-3.5 px-4 font-semibold">อีเมล</th>
                  <th className="py-3.5 px-4 font-semibold">บทบาท</th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    สถานะ
                  </th>
                  <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#94a3b8]">
                      ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f6f9fc]/50">
                      <td className="py-3.5 px-4 pl-5 font-medium text-[#0d253d]">
                        {u.name}
                        {u.isSelf && (
                          <span className="ml-1.5 text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full font-semibold">
                            คุณ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">{u.email}</td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {u.role?.name ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {u.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ใช้งานอยู่
                          </Badge>
                        ) : (
                          <Badge variant="secondary">ปิดใช้งาน</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetTarget(u)}
                            className="h-7 text-xs text-amber-600 hover:bg-amber-50 rounded-full px-2.5"
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1" />
                            เปลี่ยนรหัสผ่าน
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(u)}
                            className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
                          >
                            แก้ไข
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
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-md p-6 rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              เพิ่มผู้ใช้ระบบใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              สร้างบัญชีสำหรับเข้าใช้งานระบบหลังบ้าน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อผู้ใช้ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                name="name"
                placeholder="เช่น สมชาย ใจดี"
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                อีเมล <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                type="email"
                name="email"
                placeholder="example@company.com"
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสผ่านเริ่มต้น <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                type="password"
                name="password"
                placeholder="ความยาวอย่างน้อย 8 ตัวอักษร"
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                บทบาท (Role) <span className="text-[#ea2261]">*</span>
              </label>
              <Select name="roleId" required className="h-9 rounded-xl text-xs">
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </Select>
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
                disabled={isBusy}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isBusy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                สร้างผู้ใช้
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent
          onClose={() => setEditingUser(null)}
          className="max-w-md p-6 rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              แก้ไขข้อมูลผู้ใช้
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ปรับปรุงชื่อ บทบาท หรือสถานะการใช้งาน
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleUpdate} className="space-y-3 mt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อผู้ใช้ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  name="name"
                  defaultValue={editingUser.name}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  อีเมล
                </label>
                <Input
                  disabled
                  defaultValue={editingUser.email}
                  className="h-9 rounded-xl text-xs bg-slate-50 text-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  บทบาท (Role) <span className="text-[#ea2261]">*</span>
                </label>
                <Select
                  name="roleId"
                  defaultValue={editingUser.role?.id}
                  required
                  className="h-9 rounded-xl text-xs"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  สถานะการใช้งาน
                </label>
                <Select
                  name="status"
                  defaultValue={editingUser.status}
                  className="h-9 rounded-xl text-xs"
                >
                  <option value="ACTIVE">ใช้งานอยู่ (Active)</option>
                  <option value="INACTIVE">ปิดใช้งาน (Inactive)</option>
                </Select>
              </div>
              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="h-9 rounded-full text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
                >
                  {isBusy && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  บันทึกการแก้ไข
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <DialogContent
          onClose={() => setResetTarget(null)}
          className="max-w-md p-6 rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              ตั้งรหัสผ่านใหม่ (Reset Password)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดรหัสผ่านใหม่สำหรับ {resetTarget?.name} ({resetTarget?.email})
            </DialogDescription>
          </DialogHeader>

          {resetTarget && (
            <form onSubmit={handleResetPassword} className="space-y-3 mt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  รหัสผ่านใหม่ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  type="password"
                  name="newPassword"
                  placeholder="ความยาวอย่างน้อย 8 ตัวอักษร"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetTarget(null)}
                  className="h-9 rounded-full text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="h-9 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4"
                >
                  {isBusy && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  ยืนยันเปลี่ยนรหัสผ่าน
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}