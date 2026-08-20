"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Key,
  Webhook,
  Smartphone,
  Building2,
  ShieldCheck,
  Code2,
  Sparkles,
  Terminal,
  Search,
  CheckCircle2,
  ChevronRight,
  Copy,
  Layers,
  Clock,
  CalendarDays,
  FileCheck,
  Users,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Lock,
  Cpu,
  RefreshCw,
  Hash,
  Database,
  Radio,
  Send,
  Zap,
  Sliders,
  Check,
  AlertTriangle,
  HelpCircle,
  QrCode,
  CalendarRange,
  FileSpreadsheet,
  Workflow,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeSnippet } from "./code-snippet";

type NavSection =
  | "overview"
  | "employee-liff"
  | "admin-guide"
  | "super-admin"
  | "api-keys"
  | "api-reference"
  | "webhooks"
  | "security-faq";

export function DocsView() {
  const [activeSection, setActiveSection] = React.useState<NavSection>("overview");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [codeLang, setCodeLang] = React.useState<"curl" | "node" | "python" | "php">("curl");
  const [webhookLang, setWebhookLang] = React.useState<"express" | "nextjs" | "fastapi" | "php">("express");

  // Public URL from Environment Variable (or dynamic window.location.origin)
  const [publicUrl, setPublicUrl] = React.useState<string>(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      setPublicUrl(process.env.NEXT_PUBLIC_APP_URL);
    } else if (typeof window !== "undefined" && window.location.origin) {
      setPublicUrl(window.location.origin);
    }
  }, []);

  const navigationItems = [
    {
      group: "คู่มือการใช้งานระบบ (User Guides)",
      items: [
        { id: "overview" as NavSection, label: "ภาพรวมและแนวคิดระบบ", icon: Sparkles, badge: "Overview" },
        { id: "employee-liff" as NavSection, label: "LINE LIFF สำหรับพนักงาน", icon: Smartphone, badge: "Mobile" },
        { id: "admin-guide" as NavSection, label: "ผู้ดูแลระบบ & ฝ่ายบุคคล HR", icon: Building2, badge: "Admin Portal" },
        { id: "super-admin" as NavSection, label: "ผู้ดูแลระบบส่วนกลาง (Super Admin)", icon: ShieldCheck, badge: "Platform" },
      ],
    },
    {
      group: "นักพัฒนา & การเชื่อมต่อ (Developers & API)",
      items: [
        { id: "api-keys" as NavSection, label: "ระบบ API Key & การยืนยันตัวตน", icon: Key, badge: "Auth" },
        { id: "api-reference" as NavSection, label: "REST API Reference (Endpoints)", icon: Code2, badge: "v1.0" },
        { id: "webhooks" as NavSection, label: "ระบบ Webhook & Events", icon: Webhook, badge: "Realtime" },
        { id: "security-faq" as NavSection, label: "ความปลอดภัย & คำถามที่พบบ่อย", icon: ShieldAlert, badge: "Security" },
      ],
    },
  ];

  // Quick jump helper
  const navigateTo = (section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="LALINK" className="h-8 w-8 object-contain rounded-lg shadow-xs" />
              <span className="text-lg font-bold tracking-tight text-slate-900">
                LA<span className="text-teal-600">LINK</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center space-x-1.5">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800">ศูนย์เอกสารคู่มือ & API Reference</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                เข้าสู่ระบบผู้ดูแล
              </Button>
            </Link>
            <Link href="/liff/dashboard">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs">
                LINE LIFF พนักงาน
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ค้นหาคู่มือ, API, Webhook..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white text-xs"
                />
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-6">
                {navigationItems.map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {group.group}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateTo(item.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer ${
                              isActive
                                ? "bg-teal-600 text-white shadow-xs font-semibold"
                                : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-teal-600"}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <span
                              className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                                isActive ? "bg-teal-700/50 text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Public Domain Configuration Widget */}
              <Card className="border-slate-200 bg-white shadow-none">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                      <Radio className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                      <span>Public Domain ที่ใช้งาน:</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-teal-700 bg-teal-50 border-teal-200">
                      Environment
                    </Badge>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-2 text-slate-200 font-mono text-[11px] break-all">
                    {publicUrl}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">API Path:</span>
                    <code className="text-slate-700 font-semibold">{publicUrl}/api/v1</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-10">
              
              {/* ============================================================ */}
              {/* SECTION: OVERVIEW */}
              {/* ============================================================ */}
              {activeSection === "overview" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Sparkles className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">ระบบ LALINK คืออะไร?</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      ภาพรวมระบบและการทำงานของ LALINK
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      <strong>LALINK (ลาลิ้งค์)</strong> คือแพลตฟอร์มบริหารจัดการทรัพยากรบุคคล, วันลา, กะการทำงาน และสิทธิประโยชน์พนักงานแบบ <strong>Multi-Tenant SaaS</strong> ระดับองค์กร ที่ผสานการทำงานเข้ากับ <strong>LINE Official Account</strong> และ <strong>LINE Front-end Framework (LIFF)</strong> อย่างสมบูรณ์แบบ
                    </p>
                  </div>

                  {/* Architecture Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <div className="flex items-center space-x-2 text-teal-700 font-semibold text-sm mb-1.5">
                        <Smartphone className="h-4 w-4" />
                        <span>สำหรับพนักงาน (LIFF)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        เปิดแอป LINE สแกน QR ผูกบัญชี ยื่นใบลาเต็มวัน/ครึ่งวัน/รายชั่วโมง แนบใบรับรองแพทย์ และดูโควตาวันลาได้ทันที
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <div className="flex items-center space-x-2 text-blue-700 font-semibold text-sm mb-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>สำหรับ HR & ผู้บริหาร</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        เว็บพอร์ทัลอนุมัติใบลา จัดการโครงสร้างองค์กร ตารางกะทำงาน Multi-Step Approval และรายงานสรุปครบวงจร
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                      <div className="flex items-center space-x-2 text-purple-700 font-semibold text-sm mb-1.5">
                        <Zap className="h-4 w-4" />
                        <span>สำหรับนักพัฒนา & IT</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        REST API มาตรฐานพร้อมการยืนยันตัวตนด้วย Bearer API Key และระบบ Real-time Webhook Events รองรับ HMAC SHA-256
                      </p>
                    </div>
                  </div>

                  {/* Key Workflow Diagram */}
                  <div className="rounded-xl border border-slate-200 p-6 bg-white space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-teal-600" />
                      โฟลว์การทำงานหลักของระบบ (System Lifecycle)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
                        <span className="font-bold text-teal-800">1. Setup & Import</span>
                        <p className="text-slate-600 mt-1">HR สร้างสาขา แผนก และนำเข้าพนักงานผ่านไฟล์ CSV</p>
                      </div>
                      <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                        <span className="font-bold text-blue-800">2. Link LINE</span>
                        <p className="text-slate-600 mt-1">พนักงานสแกน QR Code ประจำบริษัทเพื่อผูกบัญชี LINE ID</p>
                      </div>
                      <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-800">3. Submit & Route</span>
                        <p className="text-slate-600 mt-1">พนักงานยื่นคำขอลา ระบบส่งแจ้งเตือนและเข้าสู่สายการอนุมัติ</p>
                      </div>
                      <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-800">4. Approve & Sync</span>
                        <p className="text-slate-600 mt-1">ผู้อนุมัติกดรับรอง ระบบตัดยอดอัตโนมัติและส่ง Webhook / Flex Message</p>
                      </div>
                    </div>
                  </div>

                  {/* User Roles & Permissions Table */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      บทบาทและระดับสิทธิ์การใช้งาน (User Roles & Access Levels)
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-semibold">บทบาท (Role)</th>
                            <th className="p-3 font-semibold">สิทธิ์และการเข้าถึง (Capabilities)</th>
                            <th className="p-3 font-semibold">ช่องทางใช้งาน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">EMPLOYEE (พนักงาน)</td>
                            <td className="p-3">ยื่นใบลา, ดูโควตาคงเหลือ, ตรวจสอบประวัติการลา, ดูปฏิทินวันหยุด, รับแจ้งเตือนผ่าน LINE</td>
                            <td className="p-3"><Badge variant="outline" className="text-teal-700 bg-teal-50 border-teal-200">LINE LIFF</Badge></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">APPROVER (ผู้อนุมัติ / หัวหน้างาน)</td>
                            <td className="p-3">พิจารณาอนุมัติ/ปฏิเสธใบลาของลูกทีมตามลำดับขั้นใน Approval Workflow</td>
                            <td className="p-3"><Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">Admin Web Portal</Badge></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">HR_ADMIN (ฝ่ายบุคคล)</td>
                            <td className="p-3">จัดการพนักงาน, นโยบายวันลา, กะทำงาน, นำเข้า CSV, ยื่นลาแทนพนักงาน, ออกรายงาน</td>
                            <td className="p-3"><Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">Admin Web Portal</Badge></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">COMPANY_ADMIN (ผู้ดูแลบริษัท)</td>
                            <td className="p-3">จัดการสิทธิ์ผู้ใช้งาน, ตั้งค่าสาขา/แผนก, บริหาร Subscription & Plan Upgrade, จัดการการตั้งค่าองค์กร</td>
                            <td className="p-3"><Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200">Admin Web Portal</Badge></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-slate-900">SUPER_ADMIN (ผู้ดูแลระบบแพลตฟอร์ม)</td>
                            <td className="p-3">บริหารจัดการทุก Tenant บริษัท, อนุมัติแผนสมาชิก, ระบบสำรองข้อมูล S3 Backup, จัดการ API Keys</td>
                            <td className="p-3"><Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200">System Admin Portal</Badge></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: EMPLOYEE LINE LIFF GUIDE */}
              {/* ============================================================ */}
              {activeSection === "employee-liff" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Smartphone className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">คู่มือพนักงาน</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      การใช้งาน LINE LIFF สำหรับพนักงาน
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      พนักงานสามารถเข้าถึงระบบได้โดยไม่ต้องติดตั้งแอปพลิเคชันเพิ่มเติม เพียงเปิดผ่าน LINE LIFF บนโทรศัพท์มือถือ
                    </p>
                  </div>

                  {/* Step 1: Account Linking */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-teal-600" />
                      1. การผูกบัญชี LINE กับข้อมูลพนักงาน (Account Linking)
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เมื่อเริ่มใช้งานครั้งแรก พนักงานต้องทำการจับคู่บัญชี LINE ของตนเองเข้ากับรหัสพนักงานในระบบ:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-teal-600" />
                          วิธีที่ 1: สแกน Company QR Code
                        </div>
                        <p className="text-slate-600">
                          เปิดกล้องในแอป LINE สแกน QR Code ประจำบริษัทที่ฝ่ายบุคคลมอบให้ ระบบจะเปิดหน้าลงทะเบียนและระบุรหัสบริษัทให้อัตโนมัติ
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-teal-600" />
                          วิธีที่ 2: กรอกรหัสพนักงานและวันเกิด
                        </div>
                        <p className="text-slate-600">
                          กรอก <strong>รหัสพนักงาน (Employee Code)</strong> และ <strong>วันเดือนปีเกิด (รองรับทั้ง พ.ศ. และ ค.ศ.)</strong> เพื่อยืนยันตัวตนอย่างปลอดภัย
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Submitting Leave Requests */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-teal-600" />
                      2. การยื่นคำขอลางาน (3 รูปแบบการลา)
                    </h2>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 border border-slate-200 rounded-lg bg-white">
                        <span className="font-bold text-slate-900">🌞 ลาเต็มวัน (Full Day):</span> ระบุวันที่เริ่มต้นและสิ้นสุด ระบบจะคำนวณจำนวนวันตามตารางเวลาและวันหยุดประจำสัปดาห์ให้อัตโนมัติ
                      </div>
                      <div className="p-3 border border-slate-200 rounded-lg bg-white">
                        <span className="font-bold text-slate-900">🌓 ลาครึ่งวัน (Half Day):</span> เลือกระหว่าง <strong>ครึ่งวันเช้า (AM)</strong> หรือ <strong>ครึ่งวันบ่าย (PM)</strong> หักโควตา 0.5 วัน
                      </div>
                      <div className="p-3 border border-slate-200 rounded-lg bg-white">
                        <span className="font-bold text-slate-900">⏱️ ลารายชั่วโมง (Hourly):</span> กำหนดเวลาเริ่มต้นและสิ้นสุด เช่น ลา 2 ชั่วโมง ระบบคำนวณสัดส่วนชั่วโมงตามกะทำงาน
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Attachments & Notifications */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Radio className="h-5 w-5 text-teal-600" />
                      3. การแนบหลักฐาน & การรับข้อความแจ้งเตือนผ่าน LINE
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      พนักงานสามารถถ่ายรูปหรืออัปโหลดไฟล์เอกสาร เช่น <strong>ใบรับรองแพทย์, เอกสารราชการ หรือรูปถ่าย</strong> โดยไฟล์จะถูกเข้ารหัสและจัดเก็บบน S3 Object Storage อย่างปลอดภัย เมื่อผลการอนุมัติออก ระบบจะส่ง <strong>Flex Message</strong> แจ้งสถานะเข้ามาในแชท LINE ส่วนตัวทันที
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: HR & COMPANY ADMIN GUIDE */}
              {/* ============================================================ */}
              {activeSection === "admin-guide" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Building2 className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">คู่มือผู้ดูแลระบบและฝ่ายบุคคล</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      คู่มือบริหารจัดการสำหรับ HR & Company Admin
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      รวมคำอธิบายการตั้งค่าฟังก์ชันสำคัญในระบบหลังบ้าน เพื่อให้องค์กรสามารถบริหารจัดการวันลาและกำลังคนได้อย่างมีประสิทธิภาพ
                    </p>
                  </div>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Users className="h-4 w-4 text-teal-600" />
                        1. การนำเข้าพนักงานด้วย CSV (Employee Import Engine)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        รองรับการอัปโหลดไฟล์ CSV พนักงานจำนวนมาก มีระบบ Auto-detect encoding, ตรวจสอบรูปแบบวันที่ พ.ศ./ค.ศ. อัตโนมัติ, พร้อมสร้างยอดสิทธิ์วันลาตั้งต้นให้ทันที
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Sliders className="h-4 w-4 text-teal-600" />
                        2. นโยบายประเภทการลา (Leave Policies)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        กำหนดประเภทการลาได้ไม่จำกัด (ลาพักร้อน, ลากิจ, ลาป่วย, ลาคลอด) พร้อมกำหนดสิทธิ์ตามอายุงาน (Years of Service) และการอนุญาตให้ยกยอดวันลา
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Workflow className="h-4 w-4 text-teal-600" />
                        3. สายการอนุมัติหลายระดับ (Multi-Step Workflows)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        สร้างขั้นตอนการอนุมัติแบบกำหนดเงื่อนไขได้ เช่น พนักงานยื่น -&gt; หัวหน้าแผนกอนุมัติ -&gt; HR รับทราบ -&gt; ผู้บริหารอนุมัติขั้นสุดท้าย
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <Clock className="h-4 w-4 text-teal-600" />
                        4. กะและตารางการทำงาน (Shifts & Schedules)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        สร้างกะการทำงาน (เช่น ปกติ 08:30-17:30 หรือ กะดึก) และมอบหมายตารางงานรายบุคคล แผนก หรือสาขา เพื่อให้ระบบคำนวณชั่วโมงการลาได้แม่นยำ 100%
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <CalendarRange className="h-4 w-4 text-teal-600" />
                        5. รอบปีการลาและการยกยอด (Carry Forward Engine)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        ตัดรอบปีการลา (Leave Year) และประมวลผลยกยอดวันพักร้อนคงเหลือข้ามปีอัตโนมัติตามนโยบายบริษัท พร้อมกำหนดวันหมดอายุของวันลายกยอด
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        <QrCode className="h-4 w-4 text-teal-600" />
                        6. โปสเตอร์ QR Code ประจำบริษัท (Company QR)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        ระบบสร้างการ์ด QR Code ความละเอียดสูงและโปสเตอร์ประชาสัมพันธ์ขนาดมาตรฐาน A4 ให้ดาวน์โหลดไปแปะหน้าบอร์ดของบริษัทได้ทันที
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: SUPER ADMIN PLATFORM */}
              {/* ============================================================ */}
              {activeSection === "super-admin" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">คู่มือผู้ดูแลระดับสูง</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      คู่มือการควบคุมแพลตฟอร์ม (Super Admin Control Plane)
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      ศูนย์ควบคุมสำหรับผู้ดูแลระบบส่วนกลาง เพื่อบริหารจัดการ Tenants, ความปลอดภัย, แผนการใช้งาน และ Disaster Recovery
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        1. การจัดการผู้เช่า (Multi-Tenant Management & Plan Requests)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        ตรวจสอบสถานะบริษัททั้งหมด, จำกัดจำนวนพนักงาน (Seat Limits), ระงับการใช้งาน (Suspend) เมื่อผิดข้อตกลง, และอนุมัติคำขออัปเกรดแพ็กเกจ (Standard, Enterprise)
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4 text-teal-600" />
                        2. ระบบสำรองฐานข้อมูล All-in-One Multi-Format Backup & S3
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        ระบบสำรองข้อมูล PostgreSQL ครบทั้ง <strong>42 ตาราง</strong> บรรจุไฟล์ `.zip` ประกอบด้วย `dump.sql` (พร้อมคำสั่ง INSERT กู้คืน 100%), `database.json`, และ `manifest.json` พร้อมส่งตรงขึ้น S3-Compatible Object Storage อย่างปลอดภัย
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                        3. ศูนย์ความปลอดภัย (Security Center & Audit Logs)
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        ระบบบันทึก Audit Logs แบบ Real-time, ตรวจสอบ Failed Login Attempts, ตรวจจับ Brute-force Attack, ระบบ Block IP อัตโนมัติ และการจัดการ Active Sessions
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: API KEYS & AUTHENTICATION */}
              {/* ============================================================ */}
              {activeSection === "api-keys" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Key className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">ระบบความปลอดภัย & API Auth</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      ระบบ API Key & การยืนยันตัวตนสำหรับนักพัฒนา
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      LALINK รองรับการเข้าถึงข้อมูลและการสั่งงานผ่าน REST API โดยใช้มาตรฐาน <strong>API Key Authentication</strong> ที่ปลอดภัยและมีประสิทธิภาพสูงสุด
                    </p>
                  </div>

                  {/* Architecture & Format */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-teal-600" />
                      1. โครงสร้างและความปลอดภัยของ API Key
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      API Key ของ LALINK จะขึ้นต้นด้วย Prefix บ่งบอกประเภท เช่น <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-700">lal_live_...</code> ตามด้วย Cryptographic Random String ความยาว 32 ไบต์:
                    </p>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-emerald-400">
                      lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-900">🔒 Zero Knowledge Storage:</span> ในฐานข้อมูลจะเก็บเฉพาะ <strong>SHA-256 Hash</strong> ของ Key เท่านั้น ไม่มีการเก็บ Secret ดิบ จึงปลอดภัยจากการรั่วไหล 100%
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-900">⚡ Fast Lookups:</span> มีการเก็บ <code className="text-slate-800">keyPrefix</code> เพื่อการจับคู่และตรวจสอบสิทธิ์ที่รวดเร็วระดับมิลลิวินาที
                      </div>
                    </div>
                  </div>

                  {/* How to generate */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-teal-600" />
                      2. วิธีการสร้างและจัดการ API Key ในระบบ
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                      <li>เข้าสู่ระบบผู้ดูแลระบบที่เมนู <strong>กุญแจเชื่อมต่อ (API Keys)</strong> (`/system-admin/api-keys` หรือ Company Settings)</li>
                      <li>คลิกปุ่ม <strong>"สร้าง API Key ใหม่" (Create API Key)</strong></li>
                      <li>ตั้งชื่อระบุวัตถุประสงค์ (เช่น <em>"ERP Integration Server"</em> หรือ <em>"Payroll Sync Job"</em>)</li>
                      <li>กำหนดขอบเขตสิทธิ์ (Permission Scopes) หรือเลือก <code>* (Full Access)</code></li>
                      <li>
                        คัดลอกรหัส API Key เก็บไว้ในที่ปลอดภัยทันที (ระบบจะแสดงรหัสเต็มเพียง <strong>ครั้งเดียวเท่านั้น</strong>)
                      </li>
                    </ol>
                  </div>

                  {/* Header Authentication */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-teal-600" />
                      3. การส่ง HTTP Authentication Header
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      แนบ API Key ไปใน HTTP Header ของทุก Request ที่ส่งเข้ามายัง LALINK REST API:
                    </p>
                    <CodeSnippet
                      language="http"
                      title="HTTP Header Example"
                      code={`Authorization: Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948
Content-Type: application/json
Accept: application/json`}
                    />
                  </div>

                  {/* Scopes Table */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-teal-600" />
                      4. ขอบเขตสิทธิ์การใช้งาน (API Permission Scopes)
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-semibold">Scope Name</th>
                            <th className="p-3 font-semibold">คำอธิบาย</th>
                            <th className="p-3 font-semibold">ตัวอย่าง API ที่เรียกได้</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[11px]">
                          <tr>
                            <td className="p-3 text-teal-700 font-bold">*</td>
                            <td className="p-3 font-sans text-xs">สิทธิ์เต็มทุกส่วน (Super Admin / Full Access)</td>
                            <td className="p-3">ทุก Endpoints ในระบบ</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900">employees:read</td>
                            <td className="p-3 font-sans text-xs">อ่านรายชื่อและข้อมูลพนักงาน</td>
                            <td className="p-3">GET /api/v1/employees</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900">leaves:read</td>
                            <td className="p-3 font-sans text-xs">ตรวจสอบประวัติและสถานะใบลา</td>
                            <td className="p-3">GET /api/v1/leaves, GET /api/v1/leave-balances</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900">leaves:write</td>
                            <td className="p-3 font-sans text-xs">สร้างคำขอลาและอัปเดตสถานะใบลา</td>
                            <td className="p-3">POST /api/v1/leaves</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-slate-900">webhooks:manage</td>
                            <td className="p-3 font-sans text-xs">จัดการการเชื่อมต่อ Webhook Endpoints</td>
                            <td className="p-3">POST /api/v1/webhooks</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: REST API REFERENCE */}
              {/* ============================================================ */}
              {activeSection === "api-reference" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Code2 className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">API Documentation</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      REST API Reference & Code Examples
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      รายละเอียด Endpoints, Parameters, ตัวอย่าง Request/Response Payload และตัวอย่างโค้ดในภาษาต่างๆ โดยใช้ Public URL: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-700 font-bold">{publicUrl}</code>
                    </p>
                  </div>

                  {/* Base URL & Status Format */}
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                        <span>Public API Base URL:</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-teal-700 bg-teal-50 border-teal-200">
                        Environment Public URL
                      </Badge>
                    </div>

                    <div className="font-mono bg-slate-900 text-teal-400 p-2.5 rounded-lg flex items-center justify-between">
                      <span>{publicUrl}/api/v1</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                        GET / POST
                      </Badge>
                    </div>

                    <p className="text-slate-600">
                      API ทั้งหมดส่งคืนผลลัพธ์เป็นมาตรฐาน JSON พร้อมฟิลด์ <code className="text-slate-800 font-bold">success</code>, <code className="text-slate-800 font-bold">data</code>, หรือ <code className="text-slate-800 font-bold">error</code>
                    </p>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">เลือกภาษาสำหรับตัวอย่างโค้ด:</span>
                    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                      {(["curl", "node", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCodeLang(lang)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            codeLang === lang ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Endpoint 1: GET /api/v1/employees */}
                  <div className="space-y-3 rounded-xl border border-slate-200 p-5 bg-white">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-emerald-600 text-white font-mono">GET</Badge>
                      <span className="font-mono text-sm font-bold text-slate-900">/api/v1/employees</span>
                      <Badge variant="outline" className="text-[10px] text-slate-500">Scope: employees:read</Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      ดึงรายชื่อพนักงานทั้งหมดของบริษัท พร้อมข้อมูลตำแหน่ง แผนก และสถานะการเชื่อมต่อ LINE
                    </p>

                    {/* Code Snippet based on selection */}
                    {codeLang === "curl" && (
                      <CodeSnippet
                        language="bash"
                        title="cURL Request"
                        code={`curl -X GET "${publicUrl}/api/v1/employees?page=1&limit=20" \\
  -H "Authorization: Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948" \\
  -H "Accept: application/json"`}
                      />
                    )}
                    {codeLang === "node" && (
                      <CodeSnippet
                        language="typescript"
                        title="Node.js / Fetch"
                        code={`const response = await fetch("${publicUrl}/api/v1/employees?page=1&limit=20", {
  method: "GET",
  headers: {
    "Authorization": "Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Accept": "application/json"
  }
});
const result = await response.json();
console.log(result.data.employees);`}
                      />
                    )}
                    {codeLang === "python" && (
                      <CodeSnippet
                        language="python"
                        title="Python (requests)"
                        code={`import requests

headers = {
    "Authorization": "Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Accept": "application/json"
}
response = requests.get("${publicUrl}/api/v1/employees?page=1&limit=20", headers=headers)
data = response.json()
print(data["data"]["employees"])`}
                      />
                    )}
                    {codeLang === "php" && (
                      <CodeSnippet
                        language="php"
                        title="PHP (cURL)"
                        code={`<?php
$ch = curl_init("${publicUrl}/api/v1/employees?page=1&limit=20");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Accept: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
print_r($result['data']['employees']);`}
                      />
                    )}

                    <CodeSnippet
                      language="json"
                      title="Response 200 OK"
                      code={`{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "emp_clz12345",
        "employeeCode": "EMP-001",
        "name": "สมชาย ใจดี",
        "email": "somchai@company.com",
        "phone": "0812345678",
        "department": "Engineering",
        "position": "Senior Developer",
        "branch": "สำนักงานใหญ่",
        "isLineConnected": true,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}`}
                    />
                  </div>

                  {/* Endpoint 2: POST /api/v1/leaves */}
                  <div className="space-y-3 rounded-xl border border-slate-200 p-5 bg-white">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-600 text-white font-mono">POST</Badge>
                      <span className="font-mono text-sm font-bold text-slate-900">/api/v1/leaves</span>
                      <Badge variant="outline" className="text-[10px] text-slate-500">Scope: leaves:write</Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      ยื่นคำขอลางานแทนพนักงานจากระบบภายนอก (เช่น ระบบ ERP หรือ Attendance Machine)
                    </p>

                    {codeLang === "curl" && (
                      <CodeSnippet
                        language="bash"
                        title="cURL Request"
                        code={`curl -X POST "${publicUrl}/api/v1/leaves" \\
  -H "Authorization: Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948" \\
  -H "Content-Type: application/json" \\
  -d '{
    "employeeId": "emp_clz12345",
    "leaveTypeId": "lt_vacation_001",
    "period": "FULL_DAY",
    "startDate": "2026-09-01",
    "endDate": "2026-09-02",
    "reason": "พักผ่อนประจำปีต่างจังหวัด"
  }'`}
                      />
                    )}
                    {codeLang === "node" && (
                      <CodeSnippet
                        language="typescript"
                        title="Node.js / Fetch"
                        code={`const response = await fetch("${publicUrl}/api/v1/leaves", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    employeeId: "emp_clz12345",
    leaveTypeId: "lt_vacation_001",
    period: "FULL_DAY",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    reason: "พักผ่อนประจำปีต่างจังหวัด"
  })
});
const result = await response.json();`}
                      />
                    )}
                    {codeLang === "python" && (
                      <CodeSnippet
                        language="python"
                        title="Python (requests)"
                        code={`import requests

payload = {
    "employeeId": "emp_clz12345",
    "leaveTypeId": "lt_vacation_001",
    "period": "FULL_DAY",
    "startDate": "2026-09-01",
    "endDate": "2026-09-02",
    "reason": "พักผ่อนประจำปีต่างจังหวัด"
}
headers = {
    "Authorization": "Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Content-Type": "application/json"
}
res = requests.post("${publicUrl}/api/v1/leaves", json=payload, headers=headers)
print(res.json())`}
                      />
                    )}
                    {codeLang === "php" && (
                      <CodeSnippet
                        language="php"
                        title="PHP (cURL)"
                        code={`<?php
$data = [
    "employeeId" => "emp_clz12345",
    "leaveTypeId" => "lt_vacation_001",
    "period" => "FULL_DAY",
    "startDate" => "2026-09-01",
    "endDate" => "2026-09-02",
    "reason" => "พักผ่อนประจำปีต่างจังหวัด"
];

$ch = curl_init("${publicUrl}/api/v1/leaves");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer lal_live_a8f9c2d1e4b706385a9172648301928374659281746281903847291048201948",
    "Content-Type": "application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);`}
                      />
                    )}

                    <CodeSnippet
                      language="json"
                      title="Response 201 Created"
                      code={`{
  "success": true,
  "data": {
    "leaveRequestId": "lr_987654321",
    "status": "PENDING",
    "daysUsed": 2.0,
    "currentApprovalStep": 1,
    "nextApprover": "somying@company.com",
    "createdAt": "2026-08-20T10:30:00.000Z"
  }
}`}
                    />
                  </div>

                  {/* HTTP Status Codes Reference */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Hash className="h-5 w-5 text-teal-600" />
                      ตารางรหัสสถานะและการตอบกลับ (HTTP Status & Error Codes)
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-semibold">Status Code</th>
                            <th className="p-3 font-semibold">ความหมาย</th>
                            <th className="p-3 font-semibold">คำอธิบาย</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[11px]">
                          <tr>
                            <td className="p-3 text-emerald-700 font-bold">200 OK</td>
                            <td className="p-3 font-sans">สำเร็จ (Success)</td>
                            <td className="p-3 font-sans">คำขอสำเร็จและส่งข้อมูลคืน</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-emerald-700 font-bold">201 Created</td>
                            <td className="p-3 font-sans">สร้างข้อมูลสำเร็จ</td>
                            <td className="p-3 font-sans">สร้าง Record ใบลา หรือข้อมูลใหม่สำเร็จ</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-amber-700 font-bold">400 Bad Request</td>
                            <td className="p-3 font-sans">ข้อมูลไม่ถูกต้อง</td>
                            <td className="p-3 font-sans">พารามิเตอร์ผิดพลาด หรือยอดวันลาคงเหลือไม่เพียงพอ</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-red-700 font-bold">401 Unauthorized</td>
                            <td className="p-3 font-sans">ไม่ผ่านการยืนยันตัวตน</td>
                            <td className="p-3 font-sans">API Key ไม่ถูกต้อง, หมดอายุ หรือถูก Revoke แล้ว</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-red-700 font-bold">403 Forbidden</td>
                            <td className="p-3 font-sans">ไม่มีสิทธิ์เข้าถึง</td>
                            <td className="p-3 font-sans">API Key ไม่มี Scope สิทธิ์สำหรับเรียก Endpoint นี้</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-purple-700 font-bold">429 Too Many Requests</td>
                            <td className="p-3 font-sans">เกินอัตราที่กำหนด</td>
                            <td className="p-3 font-sans">ส่งคำขอเกิน Rate Limit (เช่น &gt;100 req/min)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: WEBHOOKS & REAL-TIME EVENTS */}
              {/* ============================================================ */}
              {activeSection === "webhooks" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <Webhook className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Real-time Events</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      ระบบ Webhook & Real-time Integration
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      ระบบ Webhook ของ LALINK ช่วยให้ระบบภายนอก (เช่น HR Core, ERP, Slack, Discord หรือ Notification Server) ได้รับการแจ้งเตือนทันทีที่มีเหตุการณ์เกิดขึ้นในระบบแบบ Real-time โดยไม่ต้องคอย Polling
                    </p>
                  </div>

                  {/* Architecture & Flow */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Radio className="h-5 w-5 text-teal-600" />
                      1. สถาปัตยกรรม Webhook ของ LALINK
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เมื่อเกิด Event (เช่น พนักงานยื่นคำขอลา หรือผู้อนุมัติกด Approve ใบลา) LALINK จะสร้าง HTTP POST Request พร้อม JSON Payload และคำนวณ <strong>HMAC SHA-256 Signature</strong> ส่งตรงไปยัง Webhook URL ปลายทางที่คุณตั้งค่าไว้
                    </p>
                  </div>

                  {/* Event Types Table */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-teal-600" />
                      2. รายการ Event ที่รองรับ (Supported Event Types)
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-semibold">Event Name</th>
                            <th className="p-3 font-semibold">จังหวะที่ระบบยิง Webhook</th>
                            <th className="p-3 font-semibold">ข้อมูลหลักใน Payload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[11px]">
                          <tr>
                            <td className="p-3 text-teal-700 font-bold">leave.created</td>
                            <td className="p-3 font-sans">เมื่อพนักงานยื่นคำขอลางานใหม่</td>
                            <td className="p-3 font-sans">leaveId, employeeCode, leaveType, dates, reason</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-emerald-700 font-bold">leave.approved</td>
                            <td className="p-3 font-sans">เมื่อคำขอลาได้รับการอนุมัติสมบูรณ์</td>
                            <td className="p-3 font-sans">leaveId, approverName, approvedAt, daysDeducted</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-red-700 font-bold">leave.rejected</td>
                            <td className="p-3 font-sans">เมื่อคำขอลาถูกปฏิเสธ</td>
                            <td className="p-3 font-sans">leaveId, rejectReason, rejectedBy</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-amber-700 font-bold">leave.cancelled</td>
                            <td className="p-3 font-sans">เมื่อพนักงานยกเลิกคำขอลา</td>
                            <td className="p-3 font-sans">leaveId, cancelReason, balanceRestored</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-blue-700 font-bold">employee.registered</td>
                            <td className="p-3 font-sans">เมื่อพนักงานผูกบัญชี LINE ID สำเร็จ</td>
                            <td className="p-3 font-sans">employeeId, lineUserId, displayName</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-purple-700 font-bold">announcement.published</td>
                            <td className="p-3 font-sans">เมื่อ HR เผยแพร่ประกาศข่าวสารบริษัท</td>
                            <td className="p-3 font-sans">announcementId, title, targetBranches</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Webhook Payload Example */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-teal-600" />
                      3. โครงสร้าง JSON Payload ตัวอย่าง (leave.approved)
                    </h2>
                    <CodeSnippet
                      language="json"
                      title="Webhook POST Body"
                      code={`{
  "id": "evt_998877665544",
  "event": "leave.approved",
  "companyId": "comp_acme_corp",
  "timestamp": "2026-08-20T10:35:12.000Z",
  "data": {
    "leaveId": "lr_987654321",
    "employee": {
      "id": "emp_clz12345",
      "code": "EMP-001",
      "name": "สมชาย ใจดี",
      "department": "Engineering"
    },
    "leaveType": {
      "id": "lt_vacation_001",
      "name": "ลาพักร้อน (Annual Leave)"
    },
    "period": "FULL_DAY",
    "startDate": "2026-09-01",
    "endDate": "2026-09-02",
    "days": 2.0,
    "approvedBy": {
      "name": "สมหญิง รักงาน",
      "role": "MANAGER"
    },
    "remainingBalance": 8.0
  }
}`}
                    />
                  </div>

                  {/* HMAC Signature Verification */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-teal-600" />
                      4. ความปลอดภัย & การตรวจสอบ HMAC-SHA256 Signature
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เพื่อป้องกันการปลอมแปลง Request ทุก Webhook ที่ส่งออกจาก LALINK จะแนบ Header พิเศษสองตัว:
                    </p>
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2 text-xs">
                      <div><code className="font-bold text-slate-900">X-Lalink-Signature:</code> รหัส Hex ของ HMAC-SHA256 ที่คำนวณจาก Request Body + Webhook Secret</div>
                      <div><code className="font-bold text-slate-900">X-Lalink-Timestamp:</code> Unix Epoch Timestamp ป้องกัน Replay Attack (แนะนำให้ปฏิเสธหากอายุเกิน 5 นาที)</div>
                    </div>
                  </div>

                  {/* Webhook Receiver Server Code Examples */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-teal-600" />
                        5. โค้ดตัวอย่าง Webhook Receiver Server
                      </h2>
                      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                        {(["express", "nextjs", "fastapi", "php"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setWebhookLang(lang)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                              webhookLang === lang ? "bg-white text-teal-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {lang === "express" && "Node.js (Express)"}
                            {lang === "nextjs" && "Next.js Route"}
                            {lang === "fastapi" && "Python (FastAPI)"}
                            {lang === "php" && "PHP"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {webhookLang === "express" && (
                      <CodeSnippet
                        language="javascript"
                        title="Node.js / Express Webhook Handler with Signature Verification"
                        code={`const express = require('express');
const crypto = require('crypto');

const app = express();
// ใช้ raw body สำหรับคำนวณ signature
app.use(express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = process.env.LALINK_WEBHOOK_SECRET || "whsec_your_secret_here";

app.post('/api/webhook/lalink', (req, res) => {
  const signature = req.headers['x-lalink-signature'];
  const timestamp = req.headers['x-lalink-timestamp'];
  const rawBody = req.body.toString('utf8');

  // ตรวจสอบ Timestamp เพื่อป้องกัน Replay Attack (< 5 นาที)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return res.status(400).send("Timestamp expired");
  }

  // คำนวณ HMAC SHA-256
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error("Invalid signature!");
    return res.status(401).send("Invalid Webhook Signature");
  }

  // ประมวลผล Event
  const payload = JSON.parse(rawBody);
  console.log(\`Received event: \${payload.event}\`, payload.data);

  if (payload.event === 'leave.approved') {
    // ซิงค์ข้อมูลเข้า ERP หรือยิงแจ้งเตือนแผนก
    console.log(\`Leave approved for \${payload.data.employee.name}\`);
  }

  // ส่งตอบกลับ 200 OK ทันที
  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook server running on port 3000'));`}
                      />
                    )}

                    {webhookLang === "nextjs" && (
                      <CodeSnippet
                        language="typescript"
                        title="Next.js App Router (app/api/webhooks/lalink/route.ts)"
                        code={`import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LALINK_WEBHOOK_SECRET || "whsec_your_secret_here";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-lalink-signature");
    const timestamp = req.headers.get("x-lalink-timestamp");
    const rawBody = await req.text();

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
    }

    // ตรวจสอบ Signature
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(\`\${timestamp}.\${rawBody}\`)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // จัดการ Event
    switch (payload.event) {
      case "leave.created":
        console.log("New leave requested:", payload.data);
        break;
      case "leave.approved":
        console.log("Leave approved:", payload.data);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}`}
                      />
                    )}

                    {webhookLang === "fastapi" && (
                      <CodeSnippet
                        language="python"
                        title="Python / FastAPI Webhook Handler"
                        code={`from fastapi import FastAPI, Request, HTTPException, Header
import hmac
import hashlib
import json
import time

app = FastAPI()
WEBHOOK_SECRET = "whsec_your_secret_here"

@app.post("/api/webhook/lalink")
async def handle_lalink_webhook(
    request: Request,
    x_lalink_signature: str = Header(None),
    x_lalink_timestamp: str = Header(None)
):
    if not x_lalink_signature or not x_lalink_timestamp:
        raise HTTPException(status_code=400, detail="Missing signature headers")
        
    raw_body = await request.body()
    body_text = raw_body.decode('utf-8')
    
    # ป้องกัน Replay Attack
    now = int(time.time())
    if abs(now - int(x_lalink_timestamp)) > 300:
        raise HTTPException(status_code=400, detail="Timestamp expired")
        
    # คำนวณ HMAC SHA-256
    message = f"{x_lalink_timestamp}.{body_text}".encode('utf-8')
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        message,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(x_lalink_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    payload = json.loads(body_text)
    print(f"Received event: {payload.get('event')}")
    
    return {"received": True}`}
                      />
                    )}

                    {webhookLang === "php" && (
                      <CodeSnippet
                        language="php"
                        title="PHP Webhook Receiver"
                        code={`<?php
$secret = 'whsec_your_secret_here';

$signature = $_SERVER['HTTP_X_LALINK_SIGNATURE'] ?? '';
$timestamp = $_SERVER['HTTP_X_LALINK_TIMESTAMP'] ?? '';
$rawBody = file_get_contents('php://input');

if (empty($signature) || empty($timestamp)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing headers']);
    exit;
}

// ตรวจสอบ Timestamp (< 5 นาที)
if (abs(time() - intval($timestamp)) > 300) {
    http_response_code(400);
    echo json_encode(['error' => 'Timestamp expired']);
    exit;
}

// คำนวณ Signature
$expectedSignature = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

if (!hash_equals($signature, $expectedSignature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$payload = json_decode($rawBody, true);
// ประมวลผล Event
error_log("Received Event: " . $payload['event']);

http_response_code(200);
echo json_encode(['received' => true]);`}
                      />
                    )}
                  </div>

                  {/* Retry Policy */}
                  <div className="rounded-xl border border-slate-200 p-5 bg-slate-50 space-y-2 text-xs">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4 text-teal-600" />
                      นโยบายการ Retry ส่งซ้ำอัตโนมัติ (Retry & Exponential Backoff)
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      หากเซิร์ฟเวอร์ปลายทางของคุณส่งคืน Status Code อื่นที่ไม่ใช่ 2xx หรือเกิด Timeout (เกิน 5 วินาที) ระบบ LALINK จะทำการส่งซ้ำอัตโนมัติ <strong>สูงสุด 5 ครั้ง</strong> โดยใช้ระบบ Exponential Backoff (1 นาที, 5 นาที, 15 นาที, 1 ชั่วโมง, 6 ชั่วโมง)
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION: SECURITY & FAQ */}
              {/* ============================================================ */}
              {activeSection === "security-faq" && (
                <div className="space-y-8 animate-in fade-in-50 duration-300">
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-2 text-teal-600 mb-2">
                      <ShieldAlert className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">ความปลอดภัย & PDPA</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                      มาตรฐานความปลอดภัย & คำถามที่พบบ่อย (Security & FAQ)
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      ข้อมูลเกี่ยวกับมาตรฐานความปลอดภัย การปกป้องข้อมูลส่วนบุคคลตามกฎหมาย PDPA และแนวทางการปฏิบัติที่ถูกต้อง
                    </p>
                  </div>

                  {/* Security Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Strict Multi-Tenant Isolation
                      </div>
                      <p className="text-slate-600">
                        ข้อมูลของแต่ละบริษัทถูกแยกชั้นการเข้าถึงด้วย <code className="text-slate-800 font-mono">companyId</code> ในระดับ Data Access Layer ป้องกันการเข้าถึงข้อมูลข้ามองค์กร 100%
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        PDPA & Data Protection Compliance
                      </div>
                      <p className="text-slate-600">
                        ระบบจัดเก็บข้อมูลส่วนบุคคลตามมาตรฐาน PDPA มีระบบเข้ารหัสผ่าน Argon2id/Bcrypt และจัดเก็บ Audit Log ทุกกิจกรรมสำคัญ
                      </p>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-teal-600" />
                      คำถามที่พบบ่อย (Frequently Asked Questions)
                    </h2>
                    <div className="space-y-3 text-xs">
                      <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-1.5">
                        <div className="font-semibold text-slate-900">Q: หากทำ API Key สูญหายหรือหลุด ต้องทำอย่างไร?</div>
                        <div className="text-slate-600">
                          A: ให้เข้าไปที่หน้า <strong>กุญแจเชื่อมต่อ (API Keys)</strong> แล้วกดปุ่ม <strong>"ระงับใช้งาน" (Revoke)</strong> ทันที จากนั้นสร้าง Key ใหม่และนำไปอัปเดตในระบบของท่าน
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-1.5">
                        <div className="font-semibold text-slate-900">Q: พนักงาน 1 คน สามารถเปลี่ยนเครื่องหรือเปลี่ยน LINE ID ได้หรือไม่?</div>
                        <div className="text-slate-600">
                          A: ได้ โดยให้ HR กด <strong>"ยกเลิกการผูก LINE" (Unlink)</strong> ในหน้ารายชื่อพนักงาน แล้วให้พนักงานใช้เครื่องใหม่สแกน QR Code ประจำบริษัทเพื่อผูกบัญชีใหม่
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 space-y-1.5">
                        <div className="font-semibold text-slate-900">Q: Webhook รองรับการทดสอบบน Localhost หรือไม่?</div>
                        <div className="text-slate-600">
                          A: สำหรับการทดสอบในเครื่อง Local แนะนำให้ใช้เครื่องมือเช่น <code>ngrok</code> หรือ <code>localtunnel</code> เพื่อสร้าง HTTPS Public URL สำหรับรับ Webhook
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
