"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  PartyPopper,
  CalendarCheck,
  Building2,
  Calendar as CalendarIcon,
} from "lucide-react";

export interface SerializedAdminCalendarLeave {
  id: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  startPeriod: string;
  endPeriod: string;
  status: string;
  totalDays: number;
  reason: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: {
      id: string;
      name: string;
    } | null;
    position: {
      name: string;
    } | null;
  };
  leaveType: {
    name: string;
    code: string;
  };
}

export interface SerializedAdminCalendarHoliday {
  id: string;
  date: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

interface AdminCalendarViewProps {
  initialLeaves: SerializedAdminCalendarLeave[];
  initialHolidays: SerializedAdminCalendarHoliday[];
  departments: DepartmentOption[];
}

export function AdminCalendarView({
  initialLeaves,
  initialHolidays,
  departments,
}: AdminCalendarViewProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  // Filters
  const [selectedDepartmentId, setSelectedDepartmentId] =
    React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "APPROVED" | "PENDING"
  >("ALL");

  // Selected Day Modal State
  const [selectedDateEvents, setSelectedDateEvents] = React.useState<{
    date: Date;
    holiday?: SerializedAdminCalendarHoliday;
    leaves: SerializedAdminCalendarLeave[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const daysOfWeek = [
    { label: "อาทิตย์", short: "อา" },
    { label: "จันทร์", short: "จ" },
    { label: "อังคาร", short: "อ" },
    { label: "พุธ", short: "พ" },
    { label: "พฤหัสบดี", short: "พฤ" },
    { label: "ศุกร์", short: "ศ" },
    { label: "เสาร์", short: "ส" },
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Filter leaves
  const filteredLeaves = initialLeaves.filter((l) => {
    const matchesDept =
      selectedDepartmentId === "ALL" ||
      l.employee.department?.id === selectedDepartmentId;

    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;

    return matchesDept && matchesStatus;
  });

  function getEventsForDate(date: Date) {
    const key = formatDateKey(date);

    const matchingHoliday = initialHolidays.find((h) => {
      const hDate = new Date(h.date);
      return formatDateKey(hDate) === key;
    });

    const matchingLeaves = filteredLeaves.filter((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const target = new Date(date);
      target.setHours(12, 0, 0, 0);
      return target >= start && target <= end;
    });

    return { holiday: matchingHoliday, leaves: matchingLeaves };
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            ปฏิทินการลาและวันหยุดองค์กร
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ภาพรวมตารางการลาของพนักงานทุกแผนก และวันหยุดตามประเพณี
          </p>
        </div>

        {/* Navigation & Today Button */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-9 text-xs rounded-full border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc] font-semibold px-3.5"
          >
            วันนี้
          </Button>

          <div className="flex items-center bg-white border border-[#e3e8ee] rounded-full p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-full text-[#64748d] hover:text-[#0d253d] hover:bg-[#f6f9fc] transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-[#0d253d] px-3 font-mono">
              {monthNames[month]} {year + 543}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-full text-[#64748d] hover:text-[#0d253d] hover:bg-[#f6f9fc] transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#64748d] flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1 text-[#533afd]" /> แผนก:
              </span>
              <Select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="h-9 text-xs rounded-xl border-[#e3e8ee] w-44"
              >
                <option value="ALL">ทุกแผนก (ทั้งหมด)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#64748d] flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1 text-[#533afd]" /> สถานะ:
              </span>
              <div className="flex items-center space-x-1">
                {(["ALL", "APPROVED", "PENDING"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#533afd] text-white font-semibold shadow-xs"
                        : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]"
                    }`}
                  >
                    {st === "ALL"
                      ? "ทั้งหมด"
                      : st === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : "รออนุมัติ"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs text-[#64748d]">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#533afd]" />
              <span>อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
              <span>รออนุมัติ</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
              <span>วันหยุดบริษัท</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Large Calendar Grid */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-[#e3e8ee] bg-[#f6f9fc] text-center text-xs font-semibold text-[#64748d]">
            {daysOfWeek.map((d, i) => (
              <div
                key={d.label}
                className={`py-3 px-2 border-r border-[#e3e8ee]/60 last:border-r-0 ${
                  i === 0 || i === 6 ? "text-[#ea2261]/80" : ""
                }`}
              >
                <span className="hidden sm:inline">{d.label}</span>
                <span className="sm:hidden">{d.short}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 divide-y divide-[#e3e8ee]/70">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[105px] sm:min-h-[125px] p-2 bg-[#f6f9fc]/30 border-r border-[#e3e8ee]/60 last:border-r-0"
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const isToday = formatDateKey(dateObj) === formatDateKey(today);
              const { holiday, leaves } = getEventsForDate(dateObj);

              const maxVisible = 2;
              const overflowCount = leaves.length - maxVisible;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() =>
                    setSelectedDateEvents({
                      date: dateObj,
                      holiday,
                      leaves,
                    })
                  }
                  className={`min-h-[105px] sm:min-h-[125px] p-2 border-r border-[#e3e8ee]/60 last:border-r-0 transition-colors cursor-pointer hover:bg-[#f6f9fc]/90 flex flex-col justify-between ${
                    isToday
                      ? "bg-[#533afd]/5 ring-1 ring-inset ring-[#533afd]/30"
                      : ""
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        isToday ? "bg-[#533afd] text-white" : "text-[#0d253d]"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {leaves.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#533afd] font-mono">
                        {leaves.length} คน
                      </span>
                    )}
                  </div>

                  {/* Events Container */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {/* Holiday Event Badge */}
                    {holiday && (
                      <div className="rounded-md bg-[#fff1f2] border border-[#fecdd3] px-1.5 py-0.5 text-[10px] font-bold text-[#f43f5e] truncate flex items-center">
                        <PartyPopper className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{holiday.name}</span>
                      </div>
                    )}

                    {/* Leave Event Pills */}
                    {leaves.slice(0, maxVisible).map((l) => (
                      <div
                        key={l.id}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate flex items-center justify-between border ${
                          l.status === "APPROVED"
                            ? "bg-[#533afd]/10 border-[#533afd]/20 text-[#533afd]"
                            : "bg-[#fde68a]/30 border-[#fde68a] text-[#d97706]"
                        }`}
                      >
                        <span className="truncate font-semibold">
                          {l.employee.firstName} ({l.leaveType.name.slice(0, 6)}
                          )
                        </span>
                      </div>
                    ))}

                    {overflowCount > 0 && (
                      <span className="text-[10px] text-[#64748d] font-semibold block px-1">
                        +{overflowCount} คนเพิ่มเติม
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Date Details Modal Dialog */}
      <Dialog
        open={!!selectedDateEvents}
        onOpenChange={(open) => !open && setSelectedDateEvents(null)}
      >
        <DialogContent
          onClose={() => setSelectedDateEvents(null)}
          className="max-w-lg rounded-2xl p-6"
        >
          {selectedDateEvents && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3">
                  <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
                    <CalendarIcon className="h-5 w-5 text-[#533afd] mr-2" />
                    รายละเอียดการลาประจำวัน
                  </DialogTitle>
                  <span className="text-xs font-bold text-[#533afd] font-mono">
                    {selectedDateEvents.date.toLocaleDateString("th-TH", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </DialogHeader>

              {/* Holiday Alert if any */}
              {selectedDateEvents.holiday && (
                <div className="rounded-xl bg-[#fff1f2] border border-[#fecdd3] p-3 text-xs text-[#f43f5e] font-bold flex items-center">
                  <PartyPopper className="h-4 w-4 mr-2 shrink-0" />
                  วันหยุดบริษัท: {selectedDateEvents.holiday.name}
                </div>
              )}

              {/* Leaves List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedDateEvents.leaves.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748d] bg-[#f6f9fc] rounded-xl border border-dashed border-[#e3e8ee]">
                    ไม่มีพนักงานลางานในวันนี้
                  </div>
                ) : (
                  selectedDateEvents.leaves.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-xl border border-[#e3e8ee] bg-white p-3 space-y-1.5 shadow-2xs hover:border-[#533afd]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-[#0d253d]">
                            {l.employee.firstName} {l.employee.lastName}
                          </span>
                          <span className="text-[10px] text-[#64748d] font-mono">
                            ({l.employee.employeeCode})
                          </span>
                        </div>
                        <Badge
                          variant={
                            l.status === "APPROVED"
                              ? "success"
                              : l.status === "PENDING"
                                ? "warning"
                                : "outline"
                          }
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {l.status === "APPROVED"
                            ? "อนุมัติแล้ว"
                            : "รออนุมัติ"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748d] bg-[#f6f9fc] p-2 rounded-lg">
                        <div>
                          <span className="text-[#64748d]/80">แผนก:</span>{" "}
                          <span className="font-semibold text-[#0d253d]">
                            {l.employee.department?.name || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#64748d]/80">ประเภท:</span>{" "}
                          <span className="font-semibold text-[#533afd]">
                            {l.leaveType.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#64748d]/80">ช่วงวัน:</span>{" "}
                          <span className="font-medium text-[#0d253d]">
                            {new Date(l.startDate).toLocaleDateString("th-TH")}{" "}
                            - {new Date(l.endDate).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#64748d]/80">จำนวน:</span>{" "}
                          <span className="font-bold text-[#0d253d] font-mono">
                            {l.totalDays} วัน
                          </span>
                        </div>
                      </div>

                      {l.reason && (
                        <p className="text-[11px] text-[#64748d] italic pt-1">
                          เหตุผล: &ldquo;{l.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <DialogFooter className="pt-2 border-t border-[#e3e8ee]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDateEvents(null)}
                  className="rounded-full text-xs h-9 px-5"
                >
                  ปิดหน้าต่าง
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
