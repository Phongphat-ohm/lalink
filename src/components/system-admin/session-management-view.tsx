"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Search,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { superAdminRevokeSessionAction } from "@/features/company/super-admin-ops-actions";

export interface SerializedUserSession {
  id: string;
  userName: string;
  userEmail: string;
  companyName: string | null;
  companyCode: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isRevoked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface SessionManagementViewProps {
  sessions: SerializedUserSession[];
}

export function SessionManagementView({
  sessions,
}: SessionManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  async function handleRevoke(sessionId: string) {
    setIsLoading(sessionId);
    const result = await superAdminRevokeSessionAction(sessionId);
    setIsLoading(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถเพิกถอน Session ได้");
    }
  }

  const filteredSessions = sessions.filter((s) => {
    return (
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ipAddress && s.ipAddress.includes(searchTerm)) ||
      (s.companyName &&
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          จัดการ Session ผู้ใช้งานทั้งหมด (Active Sessions)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ตรวจสอบรายการ Session ที่กำลังล็อกอินอยู่ในระบบทุกอุปกรณ์ และสั่ง
          Force Revoke เมื่อพบความผิดปกติ
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, IP, บริษัท..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ผู้ใช้งาน</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">
                    อุปกรณ์ / เบราว์เซอร์
                  </th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 font-semibold">กิจกรรมล่าสุด</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ไม่พบข้อมูล Session ในระบบ
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5">
                        <span className="font-bold text-[#0d253d] block">
                          {s.userName}
                        </span>
                        <span className="text-[#64748d] text-[11px]">
                          {s.userEmail}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.companyName ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-[#0d253d]">
                              {s.companyName}
                            </span>
                            <span className="font-mono text-[10px] text-[#533afd]">
                              ({s.companyCode})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#64748d] italic">
                            Platform Central
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-[#0d253d]">
                          {s.device === "Mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-[#64748d]" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-[#64748d]" />
                          )}
                          <span>
                            {s.browser || "Chrome"} on {s.os || "Windows"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#533afd] font-semibold">
                        {s.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(s.lastActiveAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.isRevoked ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] rounded-full px-2"
                          >
                            เพิกถอนแล้ว
                          </Badge>
                        ) : (
                          <Badge
                            variant="success"
                            className="text-[10px] rounded-full px-2"
                          >
                            กำลังใช้งาน (Active)
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        {!s.isRevoked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(s.id)}
                            disabled={isLoading === s.id}
                            className="h-7 text-xs rounded-full px-3 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                          >
                            {isLoading === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <LogOut className="h-3 w-3 mr-1" /> สั่ง Force
                                Logout
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
