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
  getCompanyByScannedCodeAction,
  ScannedCompanyInfo,
} from "@/features/company/register-actions";
import {
  Loader2,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  Camera,
  RotateCcw,
  Check,
  Lock,
} from "lucide-react";

export default function LiffConnectPage() {
  const router = useRouter();
  const { liff, idToken, profile, isReady } = useLiff();

  // Step 1: SCAN - รอการสแกนด้วยกล้อง LINE
  // Step 2: CONFIRM - ดึงข้อมูลบริษัทมาแสดงให้ผู้ใช้กดยืนยันว่าถูกต้องไหม
  // Step 3: EMPLOYEE - กรอกรหัสพนักงานและวันเกิดเพื่อผูกบัญชี
  const [currentStep, setCurrentStep] = React.useState<
    "SCAN" | "CONFIRM" | "EMPLOYEE"
  >("SCAN");

  // ข้อมูลบริษัทที่ได้จากการสแกน
  const [scannedCompany, setScannedCompany] =
    React.useState<ScannedCompanyInfo | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isFetchingCompany, setIsFetchingCompany] = React.useState(false);

  // ข้อมูลพนักงาน
  const [employeeCode, setEmployeeCode] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  // ประมวลผลรหัสหรือ URL ที่ได้จากการสแกน
  const processScannedCode = React.useCallback(async (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return;

    setIsFetchingCompany(true);
    setErrorMessage(null);

    const res = await getCompanyByScannedCodeAction(rawCode);
    setIsFetchingCompany(false);

    if (!res.success || !res.data) {
      setErrorMessage(
        res.message || "ไม่พบข้อมูลบริษัทจากรหัสที่สแกน กรุณาสแกนใหม่อีกครั้ง",
      );
      setCurrentStep("SCAN");
      return;
    }

    // ดึงข้อมูลบริษัทมาแสดงทันที
    setScannedCompany(res.data);
    setCurrentStep("CONFIRM");
  }, []);

  // ตรวจสอบ Query Parameter เมื่อเปิดจาก LINE QR Direct Link
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const companyParam =
      urlParams.get("company") ||
      urlParams.get("code") ||
      urlParams.get("companyCode");

    if (companyParam && !scannedCompany) {
      processScannedCode(companyParam);
    }
  }, [processScannedCode, scannedCompany]);

  // เรียกใช้งานกล้องสแกนของ LINE (LIFF scanCodeV2 / scanCode)
  const handleStartScan = React.useCallback(async () => {
    setErrorMessage(null);

    if (!liff) {
      setErrorMessage("ระบบ LINE LIFF ยังไม่พร้อมทำงาน กรุณารอสักครู่");
      return;
    }

    try {
      setIsScanning(true);

      // เรียกใช้งาน LIFF Scanner ของ LINE โดยตรง
      if (typeof (liff as any).scanCodeV2 === "function") {
        const result = await (liff as any).scanCodeV2();
        setIsScanning(false);
        if (result && result.value) {
          await processScannedCode(result.value);
        }
      } else if (typeof (liff as any).scanCode === "function") {
        const result = await (liff as any).scanCode();
        setIsScanning(false);
        if (result && result.value) {
          await processScannedCode(result.value);
        }
      } else {
        setIsScanning(false);
        setErrorMessage(
          "ฟังก์ชันสแกนโค้ดพร้อมใช้งานเฉพาะการเปิดผ่านแอป LINE เท่านั้น",
        );
      }
    } catch (err: any) {
      setIsScanning(false);
      if (err?.code !== "USER_CANCEL") {
        console.warn("LINE scan error:", err);
        setErrorMessage(
          err?.message || "ไม่สามารถเปิดกล้องสแกนได้ กรุณาลองใหม่อีกครั้ง",
        );
      }
    }
  }, [liff, processScannedCode]);

  // ผู้ใช้กดยืนยันว่าข้อมูลบริษัทถูกต้อง
  function handleConfirmCompany() {
    if (!scannedCompany) return;
    setCurrentStep("EMPLOYEE");
    setErrorMessage(null);
  }

  // ผู้ใช้กดไม่ถูกต้อง หรือต้องการสแกนใหม่
  function handleResetScan() {
    setScannedCompany(null);
    setCurrentStep("SCAN");
    setErrorMessage(null);
    handleStartScan();
  }

  // ส่งข้อมูลผูกบัญชี
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scannedCompany) {
      setErrorMessage("กรุณาสแกนรหัสบริษัทก่อน");
      setCurrentStep("SCAN");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("companyCode", scannedCompany.code);
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
              ระบบบริหารจัดการวันลา LALINK ผ่าน LINE
            </p>
          </div>

          <CardContent className="min-w-0 overflow-hidden p-6 pt-5">
            <div className="space-y-4">
              {/* LINE Profile Header */}
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

              {/* Error Alert */}
              {errorMessage && (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Screen */}
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
                  {/* STEP 1: SCAN QR CODE WITH LINE */}
                  {currentStep === "SCAN" && (
                    <div className="space-y-4 py-3 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#533afd]/10 text-[#533afd]">
                        <QrCode className="h-8 w-8" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-[#0d253d] text-base">
                          สแกนรหัสบริษัท (Company QR)
                        </h3>
                        <p className="text-xs text-[#64748d] max-w-xs mx-auto">
                          กดปุ่มด้านล่างเพื่อเปิดกล้อง LINE สแกน QR Code
                          จากฝ่ายบุคคล (HR)
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleStartScan}
                        disabled={isScanning || isFetchingCompany}
                        className="w-full h-12 rounded-full bg-[#06c755] hover:bg-[#05b34c] text-white font-semibold text-sm shadow-md flex items-center justify-center"
                      >
                        {isScanning || isFetchingCompany ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังอ่านข้อมูล QR Code...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            เปิดกล้อง LINE สแกน QR Code บริษัท
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* STEP 2: CONFIRM COMPANY DETAILS (ดึงข้อมูลมาแสดงให้ผู้ใช้ยืนยัน) */}
                  {currentStep === "CONFIRM" && scannedCompany && (
                    <div className="space-y-4 py-2">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 rounded-full">
                          ✓ สแกนสำเร็จ • ตรวจสอบข้อมูลบริษัท
                        </span>
                        <h3 className="font-bold text-[#0d253d] text-base pt-1">
                          ข้อมูลบริษัทของคุณถูกต้องหรือไม่?
                        </h3>
                      </div>

                      {/* Card แสดงข้อมูลบริษัทที่ดึงมา */}
                      <div className="bg-[#f6f9fc] border-2 border-[#533afd]/20 rounded-2xl p-4 space-y-2.5 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[#64748d] uppercase font-semibold">
                              ชื่อองค์กร / บริษัท:
                            </span>
                            <h4 className="font-bold text-sm text-[#0d253d] leading-snug">
                              {scannedCompany.name}
                            </h4>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#533afd] bg-white border border-[#e3e8ee] px-2.5 py-1 rounded-full shadow-2xs shrink-0">
                            {scannedCompany.code}
                          </span>
                        </div>

                        {scannedCompany.address && (
                          <p className="text-xs text-[#64748d] pt-1.5 border-t border-[#e3e8ee]">
                            {scannedCompany.address}
                          </p>
                        )}
                      </div>

                      {/* ปุ่มยืนยัน หรือ สแกนใหม่ */}
                      <div className="space-y-2 pt-1">
                        <Button
                          type="button"
                          onClick={handleConfirmCompany}
                          className="w-full h-11 rounded-full bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center"
                        >
                          <Check className="mr-1.5 h-4 w-4" />
                          ถูกต้อง • ยืนยันบริษัทนี้
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetScan}
                          className="w-full h-10 rounded-full border-[#fecdd3] text-[#ea2261] hover:bg-[#ffe4e6] font-semibold text-xs flex items-center justify-center"
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          ไม่ถูกต้อง / สแกนใหม่อีกครั้ง
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ENTER EMPLOYEE DETAILS & SUBMIT */}
                  {currentStep === "EMPLOYEE" && scannedCompany && (
                    <form
                      onSubmit={handleSubmit}
                      className="min-w-0 space-y-3.5"
                    >
                      {/* Locked Company Badge */}
                      <div className="flex items-center justify-between bg-[#ecfdf5] border border-[#a7f3d0] px-3.5 py-2 rounded-2xl text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Building className="h-4 w-4 text-[#059669] shrink-0" />
                          <span className="font-bold text-[#065f46] truncate">
                            {scannedCompany.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                          <span className="font-mono font-bold text-[#059669] text-xs">
                            {scannedCompany.code}
                          </span>
                          <Lock className="h-3 w-3 text-[#059669]" />
                        </div>
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
                            className="block h-10 w-full min-w-0 max-w-full box-border appearance-none rounded-xl px-3 py-2 text-sm leading-5 cursor-pointer"
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

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setCurrentStep("SCAN")}
                          className="text-xs text-[#64748d] hover:underline"
                        >
                          ← เปลี่ยนบริษัท / สแกนใหม่
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
