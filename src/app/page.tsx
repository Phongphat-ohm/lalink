import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  Smartphone,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <img
              src="/logo.png"
              alt="LALINK Logo"
              className="h-9 w-9 object-contain shrink-0 rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              LA<span className="text-teal-600">LINK</span>
            </span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              Multi-Tenant SaaS
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                เอกสารคู่มือ & API
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                เข้าสู่ระบบผู้ดูแล
              </Button>
            </Link>
            <Link href="/liff/dashboard">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                เข้าสู่ระบบพนักงาน (LIFF)
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/50 via-white to-white py-20 sm:py-28">
          <div className="container mx-auto max-w-5xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 mb-6">
              🚀 ระบบจัดการวันลางานสำหรับองค์กรยุคใหม่ผ่าน LINE LIFF
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              ลางานง่าย อนุมัติไว <br className="hidden sm:inline" />
              <span className="text-teal-600">เชื่อมต่อไร้รอยต่อผ่าน LINE</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              โซลูชันระบบลางาน Multi-Tenant SaaS แบบ Production Ready
              พนักงานยื่นลาผ่าน LINE LIFF ได้ทันที
              ฝ่ายบุคคลและผู้บริหารอนุมัติผ่านเว็บได้อย่างสะดวก รวดเร็ว
              และปลอดภัย
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/liff/dashboard">
                <Button
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 h-12 px-8 text-base"
                >
                  เปิดใช้งานสำหรับพนักงาน{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  สำหรับผู้ดูแลระบบและ HR
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 px-6 text-base text-slate-600 hover:text-slate-900 border border-slate-200"
                >
                  คู่มือ & Webhook/API
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-slate-50/50 border-t border-slate-100">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                ฟังก์ชันครบครัน ออกแบบเพื่อทุกบทบาทในองค์กร
              </h2>
              <p className="mt-2 text-slate-600">
                มั่นใจด้วยมาตรฐานความปลอดภัยระดับองค์กรและการแยกข้อมูลเฉพาะแต่ละบริษัท
                (Tenant Isolation)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-slate-200 bg-white hover:border-teal-300 transition-colors">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-2">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">
                    LINE LIFF Mobile First
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    พนักงานไม่ต้องดาวน์โหลดแอปใหม่ เพียงเปิด LINE
                    ก็สามารถเช็ควันลาคงเหลือ ยื่นใบลา และดูประวัติการลาได้ทันที
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white hover:border-teal-300 transition-colors">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-2">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Admin Web Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    ศูนย์กลางการบริหารสำหรับ HR และผู้จัดการ อนุมัติใบลา
                    จัดการโควตา กำหนดวันหยุด และดูสถิติสรุปภาพรวม
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white hover:border-teal-300 transition-colors">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-2">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">
                    Enterprise Security & PDPA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    ปลอดภัยด้วย Multi-Tenant Isolation, Role-Based Access
                    Control, Private S3 Storage และเก็บบันทึก Audit Trail
                    ครบถ้วน
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 sm:px-6">
          <p>
            © {new Date().getFullYear()} LALINK Multi-Tenant SaaS. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/docs" className="hover:text-teal-600 font-medium">
              เอกสารคู่มือ & API Reference
            </Link>
            <Link href="/admin/login" className="hover:text-teal-600">
              เข้าสู่ระบบ HR / ผู้ดูแล
            </Link>
            <Link href="/liff/dashboard" className="hover:text-teal-600">
              LINE LIFF พนักงาน
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
