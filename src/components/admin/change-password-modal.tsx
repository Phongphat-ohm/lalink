"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/features/auth";
import {
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(null, formData);

    setIsLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "เปลี่ยนรหัสผ่านสำเร็จ",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onOpenChange(false);
        setMessage(null);
      }, 1500);
    } else {
      setMessage({
        type: "error",
        text: result.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
      });
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-md rounded-2xl p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
            <KeyRound className="h-5 w-5 text-[#533afd] mr-2" />
            เปลี่ยนรหัสผ่านผู้ใช้งาน
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748d]">
            รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์ใหญ่,
            ตัวพิมพ์เล็ก, และตัวเลข
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div
            className={`my-3 rounded-xl p-3 text-xs font-medium flex items-center ${
              message.type === "success"
                ? "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                : "bg-[#ffe4e6] text-[#ea2261] border border-[#fecdd3]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d253d]">
              รหัสผ่านปัจจุบัน <span className="text-[#ea2261]">*</span>
            </label>
            <div className="relative">
              <Input
                name="currentPassword"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="h-10 pr-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748d] hover:text-[#0d253d] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                {fieldErrors.currentPassword[0]}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d253d]">
              รหัสผ่านใหม่ <span className="text-[#ea2261]">*</span>
            </label>
            <Input
              name="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              required
              disabled={isLoading}
              className="h-10 rounded-xl"
            />
            {fieldErrors.newPassword && (
              <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                {fieldErrors.newPassword[0]}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0d253d]">
              ยืนยันรหัสผ่านใหม่ <span className="text-[#ea2261]">*</span>
            </label>
            <Input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              required
              disabled={isLoading}
              className="h-10 rounded-xl"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                {fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full h-9 px-4 text-xs font-medium"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
            >
              {isLoading ? (
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
  );
}
