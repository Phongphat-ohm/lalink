"use client";

import * as React from "react";
import {
  toBuddhistYear,
  toGregorianYear,
  THAI_MONTHS_FULL,
  parseThaiDateToCE,
  formatThaiDate,
} from "@/lib/utils/date";
import { Calendar } from "lucide-react";

export interface ThaiDateInputProps {
  id?: string;
  name: string;
  value?: string; // YYYY-MM-DD (CE or BE) or DD/MM/YYYY
  defaultValue?: string;
  onChange?: (isoDateCE: string, displayDateBE: string) => void;
  required?: boolean;
  disabled?: boolean;
  minYearBE?: number;
  maxYearBE?: number;
  label?: string;
  className?: string;
  placeholder?: string;
}

export function ThaiDateInput({
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  required,
  disabled,
  minYearBE = 2480,
  maxYearBE = 2600,
  className = "",
  placeholder = "วว/ดด/ปปปป (พ.ศ.)",
}: ThaiDateInputProps) {
  const initialDate = parseThaiDateToCE(controlledValue || defaultValue);

  const [day, setDay] = React.useState<string>(
    initialDate ? String(initialDate.getDate()) : "",
  );
  const [month, setMonth] = React.useState<string>(
    initialDate ? String(initialDate.getMonth() + 1) : "",
  );
  const [yearBE, setYearBE] = React.useState<string>(
    initialDate ? String(toBuddhistYear(initialDate.getFullYear())) : "",
  );

  // Sync if controlled value changes
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      const parsed = parseThaiDateToCE(controlledValue);
      if (parsed) {
        setDay(String(parsed.getDate()));
        setMonth(String(parsed.getMonth() + 1));
        setYearBE(String(toBuddhistYear(parsed.getFullYear())));
      } else if (!controlledValue) {
        setDay("");
        setMonth("");
        setYearBE("");
      }
    }
  }, [controlledValue]);

  // Compute computed CE value for the hidden form input
  const computedCEValue = React.useMemo(() => {
    if (!day || !month || !yearBE) return "";
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const yBE = parseInt(yearBE, 10);
    if (isNaN(d) || isNaN(m) || isNaN(yBE)) return "";

    const yCE = toGregorianYear(yBE);
    const dateObj = new Date(yCE, m - 1, d);
    if (isNaN(dateObj.getTime())) return "";

    const yStr = dateObj.getFullYear();
    const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dStr = String(dateObj.getDate()).padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  }, [day, month, yearBE]);

  // Compute display string in BE
  const displayBEValue = React.useMemo(() => {
    if (!day || !month || !yearBE) return "";
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${yearBE}`;
  }, [day, month, yearBE]);

  const handleDateChange = (newDay: string, newMonth: string, newYearBE: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYearBE(newYearBE);

    if (newDay && newMonth && newYearBE) {
      const d = parseInt(newDay, 10);
      const m = parseInt(newMonth, 10);
      const yBE = parseInt(newYearBE, 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(yBE)) {
        const yCE = toGregorianYear(yBE);
        const dateObj = new Date(yCE, m - 1, d);
        if (!isNaN(dateObj.getTime())) {
          const yStr = dateObj.getFullYear();
          const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
          const dStr = String(dateObj.getDate()).padStart(2, "0");
          const isoCE = `${yStr}-${mStr}-${dStr}`;
          const beDisplay = `${newDay.padStart(2, "0")}/${newMonth.padStart(2, "0")}/${newYearBE}`;
          onChange?.(isoCE, beDisplay);
        }
      }
    } else {
      onChange?.("", "");
    }
  };

  // Generate Year options (descending)
  const yearsList = React.useMemo(() => {
    const list: number[] = [];
    for (let y = maxYearBE; y >= minYearBE; y--) {
      list.push(y);
    }
    return list;
  }, [minYearBE, maxYearBE]);

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Hidden input storing standard ISO CE for form submissions */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={computedCEValue}
        required={required}
      />

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Day Select */}
        <div>
          <select
            value={day}
            onChange={(e) => handleDateChange(e.target.value, month, yearBE)}
            disabled={disabled}
            required={required}
            className="w-full h-10 text-xs sm:text-sm rounded-xl border border-[#a8c3de]/60 bg-white px-2 sm:px-3 text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 disabled:opacity-50"
          >
            <option value="">วัน</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Month Select */}
        <div>
          <select
            value={month}
            onChange={(e) => handleDateChange(day, e.target.value, yearBE)}
            disabled={disabled}
            required={required}
            className="w-full h-10 text-xs sm:text-sm rounded-xl border border-[#a8c3de]/60 bg-white px-2 sm:px-3 text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 disabled:opacity-50"
          >
            <option value="">เดือน</option>
            {THAI_MONTHS_FULL.map((mName, idx) => (
              <option key={idx + 1} value={String(idx + 1)}>
                {mName}
              </option>
            ))}
          </select>
        </div>

        {/* Year (พ.ศ.) Select */}
        <div>
          <select
            value={yearBE}
            onChange={(e) => handleDateChange(day, month, e.target.value)}
            disabled={disabled}
            required={required}
            className="w-full h-10 text-xs sm:text-sm rounded-xl border border-[#a8c3de]/60 bg-white px-2 sm:px-3 text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20 font-medium disabled:opacity-50"
          >
            <option value="">ปี (พ.ศ.)</option>
            {yearsList.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {computedCEValue && (
        <p className="text-[11px] text-[#533afd] flex items-center gap-1 font-medium pl-0.5">
          <Calendar className="h-3 w-3" />
          {formatThaiDate(computedCEValue, "long")} (พ.ศ. {yearBE})
        </p>
      )}
    </div>
  );
}
