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
import { Users, UserPlus, Loader2, KeyRound, ShieldAlert } from "lucide-react";

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
      router.refresh();
    } else if (res.message) {
      alert(res.message);
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
      router.refresh();
    } else if (res.message) {
      alert(res.message);
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

      {/* Users Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <Users className="h-4 w-4 text-[#533afd] mr-2" />
            ผู้ใช้ทั้งหมด ({users.length} บัญชี)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#94a3b8]">
                    ยังไม่มีผู้ใช้ในระบบ กรุณาเพิ่มผู้ใช้ใหม่
                  </td>
                </tr>
              )}
              {users.map((u) => (
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
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้สำหรับเข้าสู่ระบบ</DialogTitle>
            <DialogDescription>
              สร้างบัญชีผู้ใช้เพื่อให้ Admin/HR/หัวหน้างานเข้าสู่ระบบหลังบ้าน
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">ชื่อผู้ใช้</span>
              <Input name="name" placeholder="เช่น คุณสมชาย ใจดี" required />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">อีเมล</span>
              <Input
                name="email"
                type="email"
                placeholder="somchai@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">บทบาท</span>
              <Select name="roleId" required defaultValue="">
                <option value="" disabled>
                  เลือกบทบาท
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">รหัสผ่านตั้งต้น</span>
              <Input
                name="password"
                type="password"
                placeholder="อย่างน้อย 8 ตัว มี A-Z, a-z, 0-9"
                required
              />
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
                disabled={isBusy}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "สร้างผู้ใช้"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">ชื่อผู้ใช้</span>
              <Input name="name" defaultValue={editingUser?.name} required />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">บทบาท</span>
              <Select
                name="roleId"
                defaultValue={editingUser?.role?.id ?? ""}
                required
              >
                <option value="" disabled>
                  เลือกบทบาท
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">สถานะ</span>
              <Select
                name="status"
                defaultValue={editingUser?.status ?? "ACTIVE"}
              >
                <option value="ACTIVE">ใช้งานอยู่</option>
                <option value="INACTIVE">ปิดใช้งาน</option>
              </Select>
              {editingUser?.isSelf && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  ไม่สามารถปิดใช้งานบัญชีของตนเองได้
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog
        open={resetTarget !== null}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              รีเซ็ตรหัสผ่านของ {resetTarget?.email} (ผู้ใช้จะต้องล็อกอินใหม่)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">รหัสผ่านใหม่</span>
              <Input
                name="newPassword"
                type="password"
                placeholder="อย่างน้อย 8 ตัว มี A-Z, a-z, 0-9"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "รีเซ็ตรหัสผ่าน"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}