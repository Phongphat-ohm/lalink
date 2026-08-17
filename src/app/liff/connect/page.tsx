"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLiff } from "@/components/liff";
import { linkAccountAction } from "@/features/employee";
import {
  Loader2,
  AlertCircle,
  Link2,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default function LiffConnectPage() {
  const router = useRouter();
  const { idToken, profile, isReady } = useLiff();

  const [companyCode, setCompanyCode] = React.useState("");
  const [employeeCode, setEmployeeCode] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  function handleAutoFillDemo() {
    setCompanyCode("DEMO");
    setEmployeeCode("EMP-001");
    setDateOfBirth("1995-05-15");
    setErrorMessage(null);
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData();

    formData.set("companyCode", companyCode.trim().toUpperCase());
    formData.set("employeeCode", employeeCode.trim().toUpperCase());
    formData.set("dateOfBirth", dateOfBirth);

    if (idToken) {
      formData.set("lineIdToken", idToken);
    }

    const result = await linkAccountAction(null, formData);

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(
        result.message ||
          "ไม่สามารถเชื่อมต่อบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง",
      );

      if (result.errors) {
        setFieldErrors(result.errors);
      }

      return;
    }

    setIsSuccess(true);

    setTimeout(() => {
      router.push(result.data?.redirectUrl || "/liff/dashboard");
    }, 1000);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-teal-50/70 via-slate-50 to-slate-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-md min-w-0">
        <Card className="w-full min-w-0 overflow-hidden rounded-3xl border-slate-200 bg-white shadow-lg">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 px-6 pt-7 pb-6 text-center text-white">
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner backdrop-blur-md overflow-hidden">
              <img
                src="/logo.png"
                alt="LALINK Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-lg font-bold tracking-tight">
              เชื่อมต่อบัญชีพนักงาน
            </h1>

            <p className="mt-0.5 text-xs text-teal-200">
              ระบบบริหารจัดการวันลา LALINK
            </p>
          </div>

          <CardContent className="min-w-0 overflow-hidden p-6 pt-5">
            <div className="space-y-4">
              {/* LINE Profile */}
              <div className="flex min-w-0 items-center space-x-3.5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 p-3.5 shadow-xs">
                <div className="relative shrink-0">
                  {profile?.pictureUrl ? (
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm ring-2 ring-emerald-500/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-sm">
                      {profile?.displayName
                        ? profile.displayName.charAt(0).toUpperCase()
                        : "L"}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-400/40" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center rounded-md bg-[#06C755] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                      LINE
                    </span>

                    <span className="text-[11px] font-medium text-emerald-800">
                      บัญชีของคุณ
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                    {profile?.displayName || "ผู้ใช้งาน LINE"}
                  </p>

                  <p className="mt-0.5 flex items-center text-[10px] text-slate-500">
                    <ShieldCheck className="mr-1 h-3 w-3 shrink-0 text-emerald-600" />
                    พร้อมผูกข้อมูลเข้ากับรหัสพนักงาน
                  </p>
                </div>
              </div>

              {/* Success */}
              {isSuccess ? (
                <div className="space-y-3 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">
                    เชื่อมต่อบัญชีสำเร็จ!
                  </h3>

                  <p className="text-xs text-slate-500">
                    กำลังนำคุณเข้าสู่หน้าแดชบอร์ด...
                  </p>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />

                      <AlertDescription className="text-xs">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="min-w-0 space-y-3.5">
                    {/* Company Code */}
                    <div className="min-w-0 space-y-1">
                      <label
                        htmlFor="companyCode"
                        className="flex items-center text-xs font-semibold uppercase text-slate-700"
                      >
                        <Building className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        รหัสบริษัท (Company Code) *
                      </label>

                      <Input
                        id="companyCode"
                        name="companyCode"
                        type="text"
                        placeholder="เช่น DEMO"
                        autoCapitalize="characters"
                        value={companyCode}
                        onChange={(e) =>
                          setCompanyCode(e.target.value.toUpperCase())
                        }
                        required
                        disabled={isLoading}
                        className="box-border h-10 w-full min-w-0 max-w-full text-xs font-medium uppercase tracking-wider sm:text-sm"
                      />

                      {fieldErrors.companyCode && (
                        <p className="text-[11px] font-medium text-red-600">
                          {fieldErrors.companyCode[0]}
                        </p>
                      )}
                    </div>

                    {/* Employee Code */}
                    <div className="min-w-0 space-y-1">
                      <label
                        htmlFor="employeeCode"
                        className="flex items-center text-xs font-semibold uppercase text-slate-700"
                      >
                        <UserCheck className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        รหัสพนักงาน (Employee Code) *
                      </label>

                      <Input
                        id="employeeCode"
                        name="employeeCode"
                        type="text"
                        placeholder="เช่น EMP-001"
                        autoCapitalize="characters"
                        value={employeeCode}
                        onChange={(e) =>
                          setEmployeeCode(e.target.value.toUpperCase())
                        }
                        required
                        disabled={isLoading}
                        className="box-border h-10 w-full min-w-0 max-w-full text-xs font-medium uppercase tracking-wider sm:text-sm"
                      />

                      {fieldErrors.employeeCode && (
                        <p className="text-[11px] font-medium text-red-600">
                          {fieldErrors.employeeCode[0]}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="min-w-0 space-y-1">
                      <label
                        htmlFor="dateOfBirth"
                        className="flex items-center text-xs font-semibold text-slate-700"
                      >
                        <Calendar className="mr-1 h-3.5 w-3.5 text-slate-400" />
                        วัน/เดือน/ปีเกิด (ค.ศ.) *
                      </label>

                      <div className="relative w-full min-w-0">
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          required
                          disabled={isLoading}
                          className="
        block
        h-10
        w-full
        min-w-0
        max-w-full
        box-border
        appearance-none
        rounded-xl
        px-3
        py-2
        text-sm
        leading-5
        cursor-pointer
      "
                        />
                      </div>

                      {fieldErrors.dateOfBirth && (
                        <p className="text-[11px] font-medium text-red-600">
                          {fieldErrors.dateOfBirth[0]}
                        </p>
                      )}
                    </div>

                    {/* PDPA Consent */}
                    <div className="flex items-start space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="pdpaConsent"
                        name="pdpaConsent"
                        required
                        defaultChecked
                        className="mt-0.5 h-4 w-4 rounded border-[#a8c3de] text-[#533afd] focus:ring-[#533afd] cursor-pointer accent-[#533afd]"
                      />
                      <label
                        htmlFor="pdpaConsent"
                        className="text-[11px] text-[#64748d] leading-tight cursor-pointer"
                      >
                        ฉันได้อ่านและยินยอมให้ระบบประมวลผลข้อมูลส่วนบุคคลสำหรับการใช้งานระบบลางานตาม{" "}
                        <span className="font-semibold text-[#533afd] underline">
                          พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                        </span>
                      </label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isLoading || !isReady}
                      className="mt-2 h-11 w-full rounded-full bg-[#533afd] text-xs font-semibold shadow-md hover:bg-[#4434d4] sm:text-sm text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังตรวจสอบข้อมูล...
                        </>
                      ) : (
                        "ยืนยันและเชื่อมต่อบัญชี"
                      )}
                    </Button>
                  </form>

                  {/* Demo */}
                  <div className="border-t border-[#e3e8ee] pt-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoFillDemo}
                      className="h-8 text-xs font-medium text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5 text-[#533afd]" />
                      กรอกข้อมูลทดสอบอัตโนมัติ (Demo EMP-001)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
