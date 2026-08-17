"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  PartyPopper,
  Info,
} from "lucide-react";

export interface SerializedCalendarLeave {
  id: string;
  requestNumber: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  startPeriod: string;
  endPeriod: string;
  status: string;
  totalDays: number;
  leaveType: {
    name: string;
    code: string;
  };
}

export interface SerializedCalendarHoliday {
  id: string;
  date: string; // ISO string
  name: string;
}

interface LiffLeaveCalendarProps {
  leaveRequests: SerializedCalendarLeave[];
  holidays: SerializedCalendarHoliday[];
}

export function LiffLeaveCalendar({
  leaveRequests,
  holidays,
}: LiffLeaveCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = React.useState<Date>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Month name in Thai
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

  const daysOfWeek = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper to format date string YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Find events for a specific date
  function getEventsForDate(date: Date) {
    const key = formatDateKey(date);

    // 1. Check holidays
    const matchingHoliday = holidays.find((h) => {
      const hDate = new Date(h.date);
      return formatDateKey(hDate) === key;
    });

    // 2. Check leaves
    const matchingLeaves = leaveRequests.filter((l) => {
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

  const selectedEvents = getEventsForDate(selectedDate);
  const isSelectedToday = formatDateKey(selectedDate) === formatDateKey(today);

  return (
    <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold text-[#0d253d] flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-[#533afd]" />
          ปฏิทินวันลาและวันหยุด
        </CardTitle>

        {/* Month Navigation */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-full text-[#64748d] hover:text-[#0d253d] hover:bg-white transition-colors cursor-pointer"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-[#0d253d] px-1 font-mono">
            {monthNames[month]} {year + 543}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-full text-[#64748d] hover:text-[#0d253d] hover:bg-white transition-colors cursor-pointer"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#64748d]">
          {daysOfWeek.map((d, i) => (
            <div
              key={d}
              className={`py-1 ${
                i === 0 || i === 6 ? "text-[#ea2261]/80" : ""
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before 1st day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {/* Days in Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateObj = new Date(year, month, dayNum);
            const isToday = formatDateKey(dateObj) === formatDateKey(today);
            const isSelected =
              formatDateKey(dateObj) === formatDateKey(selectedDate);
            const { holiday, leaves } = getEventsForDate(dateObj);

            const hasApprovedLeave = leaves.some(
              (l) => l.status === "APPROVED",
            );
            const hasPendingLeave = leaves.some((l) => l.status === "PENDING");
            const hasHoliday = !!holiday;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => setSelectedDate(dateObj)}
                className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs font-mono tabular-nums ${
                  isSelected
                    ? "bg-[#533afd] text-white font-bold shadow-xs scale-105 z-10"
                    : isToday
                      ? "bg-[#533afd]/10 text-[#533afd] font-bold border border-[#533afd]/30"
                      : "text-[#0d253d] hover:bg-[#f6f9fc]"
                }`}
              >
                <span>{dayNum}</span>

                {/* Event dots */}
                <div className="flex items-center space-x-0.5 absolute bottom-1">
                  {hasApprovedLeave && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-[#533afd]"
                      }`}
                    />
                  )}
                  {hasPendingLeave && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? "bg-[#fde68a]" : "bg-[#d97706]"
                      }`}
                    />
                  )}
                  {hasHoliday && (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? "bg-[#fecdd3]" : "bg-[#f43f5e]"
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-3 pt-2 text-[10px] text-[#64748d] border-t border-[#e3e8ee]/70">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#533afd]" />
            <span>อนุมัติแล้ว</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" />
            <span>รออนุมัติ</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
            <span>วันหยุดบริษัท</span>
          </div>
        </div>

        {/* Selected Date Information Preview */}
        <div className="rounded-xl bg-[#f6f9fc] p-3 border border-[#e3e8ee]/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#0d253d]">
              {selectedDate.toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {isSelectedToday && (
              <Badge className="bg-[#533afd]/10 text-[#533afd] border-0 text-[10px] px-2 py-0.5 rounded-full">
                วันนี้
              </Badge>
            )}
          </div>

          {/* Holiday detail if any */}
          {selectedEvents.holiday && (
            <div className="flex items-center space-x-2 text-[#f43f5e] bg-[#fff1f2] p-2 rounded-lg border border-[#fecdd3]">
              <PartyPopper className="h-4 w-4 shrink-0" />
              <span className="font-bold text-[11px]">
                {selectedEvents.holiday.name} (วันหยุดบริษัท)
              </span>
            </div>
          )}

          {/* Leaves detail if any */}
          {selectedEvents.leaves.length > 0 ? (
            <div className="space-y-1.5">
              {selectedEvents.leaves.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3e8ee] shadow-2xs"
                >
                  <div className="flex items-center space-x-2">
                    <CalendarCheck
                      className={`h-3.5 w-3.5 ${
                        l.status === "APPROVED"
                          ? "text-[#533afd]"
                          : "text-[#d97706]"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-[11px] text-[#0d253d]">
                        {l.leaveType.name}
                      </span>
                      <span className="text-[10px] text-[#64748d] block font-mono">
                        {l.requestNumber} ({l.totalDays} วัน)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      l.status === "APPROVED"
                        ? "success"
                        : l.status === "PENDING"
                          ? "warning"
                          : "outline"
                    }
                    className="text-[9px] rounded-full px-2 py-0.5"
                  >
                    {l.status === "APPROVED" ? "อนุมัติแล้ว" : "รออนุมัติ"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            !selectedEvents.holiday && (
              <p className="text-[11px] text-[#64748d] italic flex items-center">
                <Info className="h-3 w-3 mr-1 text-[#64748d]" />
                ไม่มีรายการลาหรือวันหยุดในวันนี้
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
