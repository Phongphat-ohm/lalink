"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateProfileAction, changePasswordAction } from "@/features/auth";
import {
  User,
  Mail,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Building2,
  CalendarClock,
} from "lucide-react";

export interface SerializedProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName: string | null;
  companyCode: string | null;
  createdAt: string;
}

interface ProfileSettingsViewProps {
  profile: SerializedProfile;
  isSystemAdmin?: boolean;
}

export function ProfileSettingsView({
  profile,
  isSystemAdmin = false,
}: ProfileSettingsViewProps) {
  const router = useRouter();

  // Profile form state
  const [name, setName] = React.useState(profile.name);
  const [email, setEmail] = React.useState(profile.email);
  const [isSaving, setIsSaving] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setProfileMessage(null);
    setProfileFieldErrors({});

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);

    const result = await updateProfileAction(null, formData);
    setIsSaving(false);

    if (result.success) {
      setProfileMessage({
        type: "success",
        text: result.message || "บันทึกข้อมูลส่วนตัวสำเร็จ",
      });
      setTimeout(() => setProfileMessage(null), 3000);
      router.refresh();
    } else {
      setProfileMessage({
        type: "error",
        text: result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
      if (result.errors) setProfileFieldErrors(result.errors);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);
    setPasswordFieldErrors({});

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const result = await changePasswordAction(null, formData);
    setIsChangingPassword(false);

    if (result.success) {
      setPasswordMessage({
        type: "success",
        text: result.message || "เปลี่ยนรหัสผ่านสำเร็จ",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 3000);
    } else {
      setPasswordMessage({
        type: "error",
        text: result.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
      });
      if (result.errors) setPasswordFieldErrors(result.errors);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          ข้อมูลส่วนตัว (My Profile)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          จัดการข้อมูลส่วนตัวและรหัสผ่านสำหรับเข้าสู่ระบบ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: account overview + profile form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Overview Card */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <User className="h-4 w-4 mr-2 text-[#533afd]" />
                ข้อมูลบัญชีผู้ใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center space-x-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#533afd] text-white font-bold text-xl shadow-sm">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#0d253d]">{profile.name}</p>
                  <div className="flex items-center space-x-2 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[10px] rounded-full px-2 text-[#533afd] border-[#533afd]/30 bg-[#533afd]/5 font-semibold"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.role}
                    </Badge>
                    {!isSystemAdmin && profile.companyName && (
                      <Badge
                        variant="outline"
                        className="text-[10px] rounded-full px-2 text-[#0d253d] border-[#e3e8ee] bg-[#f6f9fc] font-semibold"
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        {profile.companyName}
                        {profile.companyCode
                          ? ` (${profile.companyCode})`
                          : ""}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] rounded-full px-2 text-[#64748d] border-[#e3e8ee] bg-[#f6f9fc] font-semibold"
                    >
                      <CalendarClock className="h-3 w-3 mr-1" />
                      สมัครเมื่อ{" "}
                      {new Date(profile.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileMessage && (
                  <div
                    className={`rounded-xl p-3 text-xs font-medium flex items-center ${
                      profileMessage.type === "success"
                        ? "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                        : "bg-[#ffe4e6] text-[#ea2261] border border-[#fecdd3]"
                    }`}
                  >
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    ชื่อ-นามสกุล <span className="text-[#ea2261]">*</span>
                  </label>
                  <Input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                    required
                    disabled={isSaving}
                    className="h-10 rounded-xl text-sm"
                  />
                  {profileFieldErrors.name && (
                    <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                      {profileFieldErrors.name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    อีเมลสำหรับเข้าสู่ระบบ <span className="text-[#ea2261]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                    <Input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      disabled={isSaving}
                      className="h-10 rounded-xl text-sm pl-10"
                    />
                  </div>
                  {profileFieldErrors.email && (
                    <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                      {profileFieldErrors.email[0]}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-10 px-6 text-xs font-semibold"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกข้อมูลส่วนตัว"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <KeyRound className="h-4 w-4 mr-2 text-[#533afd]" />
                เปลี่ยนรหัสผ่าน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-[#64748d] mb-4">
                รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์ใหญ่,
                ตัวพิมพ์เล็ก, และตัวเลข
              </p>

              {passwordMessage && (
                <div
                  className={`mb-4 rounded-xl p-3 text-xs font-medium flex items-center ${
                    passwordMessage.type === "success"
                      ? "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                      : "bg-[#ffe4e6] text-[#ea2261] border border-[#fecdd3]"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                      disabled={isChangingPassword}
                      className="h-10 pr-10 rounded-xl text-sm"
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
                  {passwordFieldErrors.currentPassword && (
                    <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                      {passwordFieldErrors.currentPassword[0]}
                    </p>
                  )}
                </div>

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
                    disabled={isChangingPassword}
                    className="h-10 rounded-xl text-sm"
                  />
                  {passwordFieldErrors.newPassword && (
                    <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                      {passwordFieldErrors.newPassword[0]}
                    </p>
                  )}
                </div>

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
                    disabled={isChangingPassword}
                    className="h-10 rounded-xl text-sm"
                  />
                  {passwordFieldErrors.confirmPassword && (
                    <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                      {passwordFieldErrors.confirmPassword[0]}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-10 px-6 text-xs font-semibold"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกรหัสผ่านใหม่"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: help / tips */}
        <div className="space-y-4">
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-xs font-semibold text-[#0d253d]">
                เคล็ดลับความปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {[
                "ใช้รหัสผ่านที่แตกต่างจากระบบอื่น",
                "หลีกเลี่ยงข้อมูลส่วนตัว เช่น วันเกิด หรือชื่อ",
                "เปลี่ยนรหัสผ่านเป็นระยะทุก 90 วัน",
                "อีเมลนี้ใช้สำหรับเข้าสู่ระบบและรับการแจ้งเตือน",
              ].map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2 text-[11px] text-[#64748d]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-[#059669] shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}