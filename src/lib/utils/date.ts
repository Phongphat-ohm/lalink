/**
 * Thai Buddhist Era (พ.ศ.) Date Utility Module
 * 
 * Standardizes Buddhist Era (BE / พ.ศ.) conversions across the entire LALINK application:
 * - User Input / Display: Buddhist Era (BE = CE + 543)
 * - Database Storage: Gregorian Era (CE / AD)
 */

export const THAI_MONTHS_FULL = [
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
] as const;

export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/**
 * Converts a Gregorian (CE) year to Buddhist Era (BE / พ.ศ.)
 * e.g., 2026 -> 2569
 */
export function toBuddhistYear(year: number): number {
  if (year > 2400) return year; // already Buddhist Era
  return year + 543;
}

/**
 * Converts a Buddhist Era (BE / พ.ศ.) year to Gregorian (CE) year
 * e.g., 2569 -> 2026, 2538 -> 1995
 */
export function toGregorianYear(year: number): number {
  if (year > 2400) return year - 543;
  return year;
}

/**
 * Checks if a given year number is in Buddhist Era (> 2400)
 */
export function isBuddhistYear(year: number): boolean {
  return year > 2400;
}

/**
 * Parses any date string (in BE or CE format) and returns a standard Gregorian Date object.
 * Supports:
 * - YYYY-MM-DD (e.g. "2569-08-20" or "2026-08-20")
 * - DD/MM/YYYY (e.g. "20/08/2569" or "20/08/2026")
 * - D/M/YYYY
 * - Standard ISO strings
 */
export function parseThaiDateToCE(
  dateInput: string | Date | null | undefined,
): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // 1. Check DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    let year = parseInt(dmyMatch[3], 10);
    year = toGregorianYear(year);

    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2. Check YYYY-MM-DD or YYYY/MM/DD format
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    year = toGregorianYear(year);

    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. Fallback standard parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // Check if parsed year is mistakenly in BE
    if (parsed.getFullYear() > 2400) {
      parsed.setFullYear(parsed.getFullYear() - 543);
    }
    return parsed;
  }

  return null;
}

/**
 * Normalizes any date input from forms (which may be in BE or CE) into
 * a standard ISO `YYYY-MM-DD` string in Gregorian Era (CE) for database storage.
 * e.g. "2569-08-20" -> "2026-08-20"
 * e.g. "20/08/2569" -> "2026-08-20"
 */
export function normalizeDateInput(
  dateInput: string | null | undefined,
): string | null {
  const parsed = parseThaiDateToCE(dateInput);
  if (!parsed) return null;

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Normalizes year input from forms (which may be in BE or CE) into
 * standard Gregorian (CE) year number for database storage.
 * e.g. 2569 -> 2026, 2538 -> 1995
 */
export function normalizeYearInput(
  yearInput: number | string | null | undefined,
): number {
  if (!yearInput) return new Date().getFullYear();
  const y = typeof yearInput === "string" ? parseInt(yearInput, 10) : yearInput;
  if (isNaN(y)) return new Date().getFullYear();
  return toGregorianYear(y);
}

/**
 * Formats a Date into a Thai Buddhist Era string.
 *
 * @param date Date or ISO string
 * @param formatType
 *   - 'short': "20/08/2569"
 *   - 'medium': "20 ส.ค. 2569"
 *   - 'long': "20 สิงหาคม 2569"
 *   - 'full': "วันพฤหัสบดีที่ 20 สิงหาคม พ.ศ. 2569"
 *   - 'input': "2569-08-20" (for BE date input value)
 *   - 'year': "2569"
 */
export function formatThaiDate(
  date: Date | string | null | undefined,
  formatType: "short" | "medium" | "long" | "full" | "input" | "year" = "medium",
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const beYear = toBuddhistYear(d.getFullYear());

  switch (formatType) {
    case "short":
      return `${String(day).padStart(2, "0")}/${String(monthIdx + 1).padStart(2, "0")}/${beYear}`;
    case "medium":
      return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${beYear}`;
    case "long":
      return `${day} ${THAI_MONTHS_FULL[monthIdx]} ${beYear}`;
    case "full": {
      const weekday = d.toLocaleDateString("th-TH", { weekday: "long" });
      return `${weekday}ที่ ${day} ${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${beYear}`;
    }
    case "input":
      return `${beYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    case "year":
      return String(beYear);
    default:
      return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${beYear}`;
  }
}

/**
 * Formats a Date into Thai Buddhist Era with Time
 * e.g. "20 ส.ค. 2569 14:30 น."
 */
export function formatThaiDateTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const datePart = formatThaiDate(d, "medium");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${datePart} ${hours}:${minutes} น.`;
}
