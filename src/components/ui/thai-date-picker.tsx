"use client";

import * as React from "react";
import {
  toBuddhistYear,
  toGregorianYear,
  formatThaiDate,
  parseThaiDateToCE,
  THAI_MONTHS_FULL,
  THAI_MONTHS_SHORT,
} from "@/lib/utils/date";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export interface ThaiDatePickerProps {
  id?: string;
  name: string;
  value?: string; // YYYY-MM-DD (CE or BE)
  defaultValue?: string;
  onChange?: (isoDateCE: string, displayDateBE: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ThaiDatePicker({
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  minDate,
  maxDate,
  required,
  disabled,
  placeholder = "เลือกวันที่ (พ.ศ.)",
  className = "",
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const initialDate = parseThaiDateToCE(controlledValue || defaultValue);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(initialDate);

  // Calendar navigation state (Year CE, Month 0-11)
  const [navYearCE, setNavYearCE] = React.useState<number>(
    initialDate ? initialDate.getFullYear() : new Date().getFullYear(),
  );
  const [navMonth, setNavMonth] = React.useState<number>(
    initialDate ? initialDate.getMonth() : new Date().getMonth(),
  );

  // Sync controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      const parsed = parseThaiDateToCE(controlledValue);
      setSelectedDate(parsed);
      if (parsed) {
        setNavYearCE(parsed.getFullYear());
        setNavMonth(parsed.getMonth());
      }
    }
  }, [controlledValue]);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const isoCEValue = React.useMemo(() => {
    if (!selectedDate) return "";
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const displayBEValue = React.useMemo(() => {
    if (!selectedDate) return "";
    return formatThaiDate(selectedDate, "medium");
  }, [selectedDate]);

  const handleSelectDate = (d: number) => {
    const newDate = new Date(navYearCE, navMonth, d);
    setSelectedDate(newDate);

    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(newDate.getDate()).padStart(2, "0");
    const isoCE = `${y}-${m}-${dayStr}`;
    const displayBE = formatThaiDate(newDate, "medium");

    onChange?.(isoCE, displayBE);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYearCE(navYearCE + 1);
    } else {
      setNavMonth(navMonth + 1);
    }
  };

  const prevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYearCE(navYearCE - 1);
    } else {
      setNavMonth(navMonth - 1);
    }
  };

  // Days matrix for current month
  const daysInMonth = new Date(navYearCE, navMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(navYearCE, navMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...

  const navYearBE = toBuddhistYear(navYearCE);

  // Year options for fast jump
  const currentBE = toBuddhistYear(new Date().getFullYear());
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentBE - 15 + i);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input storing standard ISO CE for standard form submission */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={isoCEValue}
        required={required}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between h-10 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#a8c3de]/60 bg-white text-[#0d253d] hover:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 disabled:opacity-50 text-left transition-all cursor-pointer"
      >
        <span className={selectedDate ? "font-medium text-[#0d253d]" : "text-slate-400"}>
          {displayBEValue || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-[#533afd] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-50 zoom-in-95">
          {/* Header navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={navMonth}
                onChange={(e) => setNavMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
              >
                {THAI_MONTHS_FULL.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={navYearBE}
                onChange={(e) => {
                  const selectedBE = parseInt(e.target.value, 10);
                  setNavYearCE(toGregorianYear(selectedBE));
                }}
                className="text-xs font-bold text-[#533afd] bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1 cursor-pointer"
              >
                {yearOptions.map((yBE) => (
                  <option key={yBE} value={yBE}>
                    {yBE}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[10px] font-bold text-slate-400">
            <span>อา</span>
            <span>จ</span>
            <span>อ</span>
            <span>พ</span>
            <span>พฤ</span>
            <span>ศ</span>
            <span>ส</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading empty days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === d &&
                selectedDate.getMonth() === navMonth &&
                selectedDate.getFullYear() === navYearCE;

              const isToday =
                new Date().getDate() === d &&
                new Date().getMonth() === navMonth &&
                new Date().getFullYear() === navYearCE;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDate(d)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#533afd] text-white shadow-xs"
                      : isToday
                        ? "bg-indigo-50 text-[#533afd] font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Bottom Today Button */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setNavYearCE(today.getFullYear());
                setNavMonth(today.getMonth());
                handleSelectDate(today.getDate());
              }}
              className="text-[#533afd] font-semibold hover:underline cursor-pointer"
            >
              วันนี้ ({formatThaiDate(new Date(), "medium")})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                onChange?.("", "");
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ล้างค่า
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
