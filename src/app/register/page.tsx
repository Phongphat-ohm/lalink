"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  registerCompanyAction,
  getAutoCompanyCodeAction,
} from "@/features/company/register-actions";
import {
  Building2,
  User,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function CompanyRegisterPage() {
  const router = useRouter();

  const [companyCode, setCompanyCode] = React.useState("");
  const [isGeneratingCode, setIsGeneratingCode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [registeredData, setRegisteredData] = React.useState<{
    companyCode: string;
    adminEmail: string;
  } | null>(null);

  // Auto-generate company code on load
  const generateCode = React.useCallback(async () => {
    setIsGeneratingCode(true);
    const res = await getAutoCompanyCodeAction();
    setIsGeneratingCode(false);
    if (res.success && res.data) {
      setCompanyCode(res.data.code);
    }
  }, []);

  React.useEffect(() => {
    generateCode();
  }, [generateCode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await registerCompanyAction(null, formData);

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
      if (result.errors) {
        setFieldErrors(result.errors);
      }
      return;
    }

    if (result.data) {
      setRegisteredData(result.data);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl">
        <Card className="border-[#e3e8ee] bg-white shadow-[0_12px_32px_rgba(0,55,112,0.08)] rounded-3xl overflow-hidden">
          <CardHeader className="text-center p-6 sm:p-8 pb-4 bg-white border-b border-[#e3e8ee]/70">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-md">
              <img
                src="/logo.png"
                alt="LALINK Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-[#0d253d] tracking-tight display-title">
              สมัครสมาชิกองค์กรใหม่
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-[#64748d] mt-1 max-w-md mx-auto">
              เริ่มต้นใช้งานระบบบริหารจัดการวันลาและเชื่อมต่อ LINE
              สำหรับพนักงานในองค์กรของคุณ
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-6">
            {registeredData ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669] shadow-sm">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-bold text-[#0d253d]">
                  สมัครสมาชิกองค์กรสำเร็จ!
                </h3>
                <div className="bg-[#f6f9fc] border border-[#e3e8ee] rounded-2xl p-4 text-xs text-[#0d253d] space-y-2 max-w-sm mx-auto text-left">
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">
                      รหัสบริษัท (Tenant Code):
                    </span>
                    <span className="font-mono font-bold text-[#533afd] text-sm">
                      {registeredData.companyCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">อีเมลผู้ดูแล:</span>
                    <span className="font-semibold">
                      {registeredData.adminEmail}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748d] pt-1 border-t border-[#e3e8ee]">
                    ระบบได้เตรียมแผนกและนโยบายวันลาพื้นฐาน (ลาพักร้อน, ลาป่วย,
                    ลากิจ) ให้เรียบร้อยแล้ว
                  </p>
                </div>

                <div className="pt-3">
                  <Link href="/admin/login">
                    <Button className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-8 h-11 text-sm font-semibold shadow-md">
                      เข้าสู่ระบบแอดมิน{" "}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <Alert variant="destructive" className="mb-6 rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section 1: Company Info */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-[#533afd] uppercase tracking-wider flex items-center">
                      <Building2 className="h-4 w-4 mr-1.5" /> 1. ข้อมูลองค์กร
                      (Company Details)
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#0d253d]">
                        ชื่อบริษัท / นามนิติบุคคล{" "}
                        <span className="text-[#ea2261]">*</span>
                      </label>
                      <Input
                        name="companyName"
                        type="text"
                        placeholder="เช่น บริษัท ลาลิ้งค์ เทคโนโลยี จำกัด"
                        required
                        disabled={isLoading}
                        className="h-10 rounded-xl text-xs sm:text-sm"
                      />
                      {fieldErrors.companyName && (
                        <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                          {fieldErrors.companyName[0]}
                        </p>
                      )}
                    </div>

                    {/* Auto Generated Company Code (Enforced System Auto-Generation) */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-[#0d253d] flex items-center">
                          รหัสบริษัท (Tenant Code){" "}
                          <span className="ml-1.5 text-[10px] text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] font-semibold px-2 py-0.5 rounded-full">
                            สร้างอัตโนมัติโดยระบบ
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={generateCode}
                          disabled={isGeneratingCode || isLoading}
                          className="text-[11px] font-semibold text-[#533afd] hover:underline flex items-center cursor-pointer"
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1 ${
                              isGeneratingCode ? "animate-spin" : ""
                            }`}
                          />
                          สุ่มรหัสใหม่
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          name="companyCode"
                          type="text"
                          value={companyCode}
                          readOnly
                          placeholder="กำลังสร้างรหัส..."
                          required
                          className="h-10 rounded-xl uppercase font-mono font-bold tracking-wider text-[#533afd] bg-[#f6f9fc] border-[#a8c3de]/60 text-xs sm:text-sm pr-10 cursor-not-allowed select-none"
                        />
                        <Sparkles className="h-4 w-4 text-[#533afd] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-[#64748d]">
                        ระบบสร้างรหัส 6 หลักเฉพาะให้อัตโนมัติ
                        (ไม่สามารถกำหนดเองได้) เพื่อความปลอดภัยและไม่ซ้ำซ้อน
                      </p>
                      {fieldErrors.companyCode && (
                        <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                          {fieldErrors.companyCode[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0d253d]">
                          อีเมลติดต่อองค์กร
                        </label>
                        <Input
                          name="contactEmail"
                          type="email"
                          placeholder="contact@company.com"
                          disabled={isLoading}
                          className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0d253d]">
                          เบอร์โทรศัพท์ติดต่อ
                        </label>
                        <Input
                          name="contactPhone"
                          type="tel"
                          placeholder="02-xxx-xxxx"
                          disabled={isLoading}
                          className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Admin Account */}
                  <div className="space-y-3.5 pt-3 border-t border-[#e3e8ee]">
                    <h3 className="text-xs font-bold text-[#533afd] uppercase tracking-wider flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> 2.
                      ข้อมูลผู้ดูแลระบบหลัก (Admin Account)
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#0d253d]">
                        ชื่อ-นามสกุล ผู้ดูแลระบบ{" "}
                        <span className="text-[#ea2261]">*</span>
                      </label>
                      <Input
                        name="adminName"
                        type="text"
                        placeholder="เช่น สมชาย มั่นคง"
                        required
                        disabled={isLoading}
                        className="h-10 rounded-xl text-xs sm:text-sm"
                      />
                      {fieldErrors.adminName && (
                        <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                          {fieldErrors.adminName[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#0d253d]">
                        อีเมลผู้ดูแลระบบ (ใช้เข้าสู่ระบบ){" "}
                        <span className="text-[#ea2261]">*</span>
                      </label>
                      <Input
                        name="adminEmail"
                        type="email"
                        placeholder="admin@company.com"
                        required
                        disabled={isLoading}
                        className="h-10 rounded-xl text-xs sm:text-sm"
                      />
                      {fieldErrors.adminEmail && (
                        <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                          {fieldErrors.adminEmail[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0d253d]">
                          รหัสผ่าน <span className="text-[#ea2261]">*</span>
                        </label>
                        <Input
                          name="adminPassword"
                          type="password"
                          placeholder="อย่างน้อย 8 ตัวอักษร"
                          required
                          disabled={isLoading}
                          className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                        {fieldErrors.adminPassword && (
                          <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                            {fieldErrors.adminPassword[0]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#0d253d]">
                          ยืนยันรหัสผ่าน{" "}
                          <span className="text-[#ea2261]">*</span>
                        </label>
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="กรอกรหัสผ่านอีกครั้ง"
                          required
                          disabled={isLoading}
                          className="h-10 rounded-xl text-xs sm:text-sm"
                        />
                        {fieldErrors.confirmPassword && (
                          <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                            {fieldErrors.confirmPassword[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isGeneratingCode}
                    className="w-full bg-[#533afd] hover:bg-[#4434d4] h-12 text-sm font-semibold shadow-md rounded-full mt-4 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังสร้างบัญชีองค์กร...
                      </>
                    ) : (
                      "ยืนยันการสมัครสมาชิกและสร้างองค์กร"
                    )}
                  </Button>
                </form>

                <div className="mt-6 border-t border-[#e3e8ee] pt-4 text-center text-xs text-[#64748d]">
                  มีบัญชีองค์กรอยู่แล้ว?{" "}
                  <Link
                    href="/admin/login"
                    className="text-[#533afd] font-semibold hover:underline"
                  >
                    เข้าสู่ระบบผู้ดูแล
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
