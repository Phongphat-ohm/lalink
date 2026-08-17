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
import { superAdminResetUserPasswordAction } from "@/features/company";
import {
  Users,
  Search,
  KeyRound,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";

export interface SerializedGlobalUser {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  role: {
    code: string;
    name: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface UserManagementTableProps {
  initialUsers: SerializedGlobalUser[];
}

export function UserManagementTable({
  initialUsers,
}: UserManagementTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] =
    React.useState<SerializedGlobalUser | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = React.useState<
    string | null
  >(null);
  const [resetError, setResetError] = React.useState<string | null>(null);

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
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company &&
        (u.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.company.code.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          รายชื่อผู้ดูแลระบบทั้งหมดในแพลตฟอร์ม
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ตรวจสอบบัญชี Admin / HR / Manager ข้ามทุก Tenant
          และจัดการรีเซ็ตรหัสผ่าน
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="py-3.5 px-4 font-semibold">อีเมล</th>
                  <th className="py-3.5 px-4 font-semibold">สังกัดองค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">สิทธิ์ (Role)</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 font-semibold">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ไม่พบข้อมูลผู้ใช้งานตามคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-bold text-[#0d253d]">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">{u.email}</td>
                      <td className="py-3.5 px-4">
                        {u.company ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-[#0d253d]">
                              {u.company.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full">
                              {u.company.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#64748d] italic">
                            Platform Central
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.role.code === "SYSTEM_ADMIN"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px] rounded-full px-2.5 py-0.5"
                        >
                          {u.role.name}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.status === "ACTIVE" ? "success" : "destructive"
                          }
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetTargetUser(u);
                            setNewPassword("");
                            setResetError(null);
                            setResetSuccessMessage(null);
                          }}
                          className="h-7 text-xs rounded-full px-3 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10 font-semibold"
                        >
                          <KeyRound className="h-3 w-3 mr-1" /> รีเซ็ตรหัสผ่าน
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
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
    </div>
  );
}
