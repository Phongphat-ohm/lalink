"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  Zap,
} from "lucide-react";

interface HealthMetric {
  service: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  description: string;
}

interface SystemHealthViewProps {
  metrics: HealthMetric[];
  dbStats: {
    totalCompanies: number;
    totalEmployees: number;
    totalLeaveRequests: number;
  };
  serverUptime: string;
}

export function SystemHealthView({
  metrics,
  dbStats,
  serverUptime,
}: SystemHealthViewProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 600);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            สถานะโครงสร้างพื้นฐานระบบ (System Health)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            มอนิเตอร์สถานะการเชื่อมต่อ Database, Storage, LINE API, Email
            Service และประสิทธิภาพเซิร์ฟเวอร์
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-full text-xs h-9 px-4 border-[#e3e8ee] text-[#0d253d] font-semibold"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          รีเฟรชสถานะ
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card
            key={m.service}
            className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#533afd]/10 text-[#533afd] flex items-center justify-center font-bold">
                  {m.service.includes("Database") ? (
                    <Database className="h-5 w-5" />
                  ) : m.service.includes("Storage") ? (
                    <HardDrive className="h-5 w-5" />
                  ) : m.service.includes("LINE") ? (
                    <Smartphone className="h-5 w-5" />
                  ) : m.service.includes("Email") ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <Server className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0d253d]">
                    {m.service}
                  </h3>
                  <p className="text-[11px] text-[#64748d]">{m.description}</p>
                </div>
              </div>

              <Badge
                variant={m.status === "ONLINE" ? "success" : "destructive"}
                className="text-[10px] rounded-full px-2.5 py-0.5"
              >
                {m.status}
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e3e8ee]/70 flex items-center justify-between text-xs">
              <span className="text-[#64748d]">Latency Response:</span>
              <span className="font-mono font-bold text-[#059669]">
                {m.latencyMs} ms
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Database Statistics */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl p-5">
        <CardHeader className="p-0 pb-4 border-b border-[#e3e8ee]">
          <CardTitle className="text-sm font-bold text-[#0d253d] flex items-center">
            <Zap className="h-4 w-4 text-[#533afd] mr-2" />
            ข้อมูลสรุปเชิงปริมาณ (Database Capacity)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-[#f6f9fc] p-4 rounded-xl">
            <span className="text-xs text-[#64748d]">องค์กรทั้งหมดในระบบ</span>
            <p className="text-2xl font-bold font-mono text-[#0d253d] mt-1">
              {dbStats.totalCompanies} บริษัท
            </p>
          </div>
          <div className="bg-[#f6f9fc] p-4 rounded-xl">
            <span className="text-xs text-[#64748d]">
              พนักงานทั้งหมด (All Tenants)
            </span>
            <p className="text-2xl font-bold font-mono text-[#533afd] mt-1">
              {dbStats.totalEmployees} คน
            </p>
          </div>
          <div className="bg-[#f6f9fc] p-4 rounded-xl">
            <span className="text-xs text-[#64748d]">
              คำขอลาทั้งหมด (Total Requests)
            </span>
            <p className="text-2xl font-bold font-mono text-[#059669] mt-1">
              {dbStats.totalLeaveRequests} รายการ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
