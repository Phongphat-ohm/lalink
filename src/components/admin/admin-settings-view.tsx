"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { updateCompanySettingsAction } from "@/features/company";
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  BellRing,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Download,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { CompanyQrModal } from "@/components/admin/company-qr-modal";

export interface SerializedCompanySettings {
  id: string;
  code: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
}

interface AdminSettingsViewProps {
  company: SerializedCompanySettings;
  liffId?: string;
}

export function AdminSettingsView({
  company,
  liffId = "",
}: AdminSettingsViewProps) {
  const [name, setName] = React.useState(company.name);
  const [taxId, setTaxId] = React.useState(company.taxId || "");
  const [email, setEmail] = React.useState(company.email || "");
  const [phone, setPhone] = React.useState(company.phone || "");
  const [address, setAddress] = React.useState(company.address || "");

  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);

  const liffUrl = liffId ? `https://liff.line.me/${liffId}` : "/liff/connect";

  function handleCopyCompanyCode() {
    navigator.clipboard.writeText(company.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateCompanySettingsAction(null, formData);

    setIsLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "บันทึกการตั้งค่าเรียบร้อยแล้ว",
      });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({
        type: "error",
        text: result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          ตั้งค่าระบบองค์กร (Organization Settings)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          จัดการข้อมูลบริษัท การเชื่อมต่อ LINE LIFF และนโยบายความปลอดภัย
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center shadow-xs ${
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Organization Profile Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Building2 className="h-4 w-4 text-[#533afd] mr-2" />
                ข้อมูลนิติบุคคลและที่อยู่ติดต่อ
              </CardTitle>
              <CardDescription className="text-xs text-[#64748d]">
                ข้อมูลนี้จะถูกนำไปใช้ในรายงานและหัวเอกสารใบลาขององค์กร
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Code (Readonly) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      รหัสองค์กร (Tenant Code)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={company.code}
                        disabled
                        className="h-10 rounded-xl font-mono font-bold text-[#533afd] bg-[#f6f9fc]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCompanyCode}
                        className="h-10 rounded-xl px-3 border-[#e3e8ee] text-[#533afd]"
                        title="คัดลอกรหัส"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-[10px] text-[#059669] font-medium">
                        คัดลอกรหัสบริษัทแล้ว!
                      </p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      ชื่อบริษัท / องค์กร{" "}
                      <span className="text-[#ea2261]">*</span>
                    </label>
                    <Input
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tax ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      เลขประจำตัวผู้เสียภาษี (Tax ID)
                    </label>
                    <Input
                      name="taxId"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="01055xxxxxxxx"
                      disabled={isLoading}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      อีเมลติดต่อกลาง
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.com"
                      disabled={isLoading}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <Input
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="02-xxx-xxxx"
                      disabled={isLoading}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0d253d]">
                      สถานะองค์กรในระบบ
                    </label>
                    <div className="h-10 flex items-center">
                      <Badge
                        variant={
                          company.status === "ACTIVE"
                            ? "success"
                            : "destructive"
                        }
                        className="text-xs rounded-full px-3 py-1"
                      >
                        {company.status === "ACTIVE"
                          ? "เปิดใช้งานปกติ (Active)"
                          : "ระงับชั่วคราว"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    ที่อยู่สำนักงาน
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="เลขที่ อาคาร ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                    disabled={isLoading}
                    className="flex w-full rounded-xl border border-[#a8c3de]/60 bg-white p-3 text-xs placeholder:text-[#64748d]/60 focus-visible:outline-none focus-visible:border-[#533afd] focus-visible:ring-2 focus-visible:ring-[#533afd]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-6 h-10 text-xs font-semibold shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />{" "}
                        บันทึกการเปลี่ยนแปลง
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: LINE LIFF & Security Info (1 col) */}
        <div className="space-y-6">
          {/* SaaS Subscription Quick Card */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <CreditCard className="h-4 w-4 text-[#533afd] mr-2" />
                แพ็กเกจและการสมัครสมาชิก (SaaS)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-[#64748d]">
              <p>
                ตรวจสอบโควตาพนักงาน สิทธิ์การใช้งาน และระยะเวลาของแพ็กเกจองค์กร
              </p>
              <Link href="/admin/subscription" className="block w-full">
                <Button
                  type="button"
                  className="w-full h-8 rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  ดูรายละเอียดแพ็กเกจ & โควตา
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* LINE LIFF Employee Connect Guide */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Smartphone className="h-4 w-4 text-[#06c755] mr-2" />
                การเชื่อมต่อ LINE สำหรับพนักงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-[#64748d]">
              <p>
                แชร์รหัสบริษัทและลิงก์ LIFF ให้พนักงานเพื่อผูกบัญชี LINE
                กับระบบ:
              </p>

              <div className="rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] p-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-[#0d253d] block">
                  รหัสบริษัท (Company Code):
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-[#533afd]">
                    {company.code}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCompanyCode}
                    className="h-7 text-[11px] rounded-full px-2.5"
                  >
                    คัดลอก
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-[#06c755]/10 border border-[#06c755]/20 p-3 space-y-2 text-[#06c755]">
                <div className="flex items-center font-bold text-xs">
                  <QrCode className="h-4 w-4 mr-1.5" /> LINE LIFF Ready
                </div>
                <p className="text-[11px] text-[#0d253d]">
                  พนักงานสามารถกดเข้า Rich Menu
                  หรือเปิดลิงก์เพื่อยื่นใบลาและเช็กโควตาได้ตลอด 24 ชม.
                </p>

                <Button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full h-8 rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold shadow-xs mt-1"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  ดู & ดาวน์โหลด QR Code บริษัท
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security & PDPA Badge Card */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <ShieldCheck className="h-4 w-4 text-[#533afd] mr-2" />
                ความปลอดภัยและ PDPA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs text-[#64748d]">
              <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]/60">
                <span>รหัสผ่านผู้ใช้งาน:</span>
                <span className="font-semibold text-[#059669]">
                  Argon2id Encrypted
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]/60">
                <span>การคุ้มครองข้อมูลส่วนบุคคล:</span>
                <span className="font-semibold text-[#059669]">
                  PDPA Compliant
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]/60">
                <span>การแยกข้อมูล Tenant:</span>
                <span className="font-semibold text-[#533afd]">
                  Multi-Tenant Isolated
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>บันทึกประวัติการทำงาน:</span>
                <span className="font-semibold text-[#059669]">
                  Immutable Audit Log
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Company QR Code Modal */}
      <CompanyQrModal
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
        companyName={company.name}
        companyCode={company.code}
      />
    </div>
  );
}
