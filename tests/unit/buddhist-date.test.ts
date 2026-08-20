import { describe, it, expect } from "vitest";
import {
  toBuddhistYear,
  toGregorianYear,
  isBuddhistYear,
  parseThaiDateToCE,
  formatThaiDate,
  formatThaiDateTime,
  normalizeDateInput,
  normalizeYearInput,
} from "@/lib/utils/date";

describe("Thai Buddhist Era (พ.ศ.) Date Utilities", () => {
  describe("Year Conversions", () => {
    it("should convert Gregorian (CE) year to Buddhist Era (BE)", () => {
      expect(toBuddhistYear(2026)).toBe(2569);
      expect(toBuddhistYear(1995)).toBe(2538);
      expect(toBuddhistYear(2000)).toBe(2543);
      // If already BE, should return unchanged
      expect(toBuddhistYear(2569)).toBe(2569);
    });

    it("should convert Buddhist Era (BE) year to Gregorian (CE)", () => {
      expect(toGregorianYear(2569)).toBe(2026);
      expect(toGregorianYear(2538)).toBe(1995);
      expect(toGregorianYear(2543)).toBe(2000);
      // If already CE, should return unchanged
      expect(toGregorianYear(2026)).toBe(2026);
    });

    it("should correctly identify Buddhist Era years", () => {
      expect(isBuddhistYear(2569)).toBe(true);
      expect(isBuddhistYear(2538)).toBe(true);
      expect(isBuddhistYear(2026)).toBe(false);
      expect(isBuddhistYear(1995)).toBe(false);
    });
  });

  describe("Date Parsing (parseThaiDateToCE)", () => {
    it("should parse YYYY-MM-DD in Buddhist Era to Gregorian Date", () => {
      const parsed = parseThaiDateToCE("2569-08-20");
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed?.getDate()).toBe(20);
    });

    it("should parse DD/MM/YYYY in Buddhist Era to Gregorian Date", () => {
      const parsed = parseThaiDateToCE("15/05/2538");
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(1995);
      expect(parsed?.getMonth()).toBe(4); // May
      expect(parsed?.getDate()).toBe(15);
    });

    it("should parse YYYY-MM-DD in Gregorian Era properly", () => {
      const parsed = parseThaiDateToCE("2026-08-20");
      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(7);
      expect(parsed?.getDate()).toBe(20);
    });

    it("should return null for invalid date inputs", () => {
      expect(parseThaiDateToCE("invalid-date")).toBeNull();
      expect(parseThaiDateToCE("")).toBeNull();
      expect(parseThaiDateToCE(null)).toBeNull();
      expect(parseThaiDateToCE(undefined)).toBeNull();
    });
  });

  describe("Normalization Helpers", () => {
    it("should normalize BE date to ISO CE string", () => {
      expect(normalizeDateInput("2569-08-20")).toBe("2026-08-20");
      expect(normalizeDateInput("15/05/2538")).toBe("1995-05-15");
      expect(normalizeDateInput("2026-08-20")).toBe("2026-08-20");
      expect(normalizeDateInput("invalid")).toBeNull();
    });

    it("should normalize BE year to CE number", () => {
      expect(normalizeYearInput(2569)).toBe(2026);
      expect(normalizeYearInput("2569")).toBe(2026);
      expect(normalizeYearInput(2026)).toBe(2026);
    });
  });

  describe("Date Formatting (formatThaiDate)", () => {
    const testDate = new Date(2026, 7, 20); // 20 August 2026

    it("should format as short (DD/MM/YYYY in BE)", () => {
      expect(formatThaiDate(testDate, "short")).toBe("20/08/2569");
    });

    it("should format as medium (DD ShortMonth YYYY in BE)", () => {
      expect(formatThaiDate(testDate, "medium")).toBe("20 ส.ค. 2569");
    });

    it("should format as long (DD FullMonth YYYY in BE)", () => {
      expect(formatThaiDate(testDate, "long")).toBe("20 สิงหาคม 2569");
    });

    it("should format as year only", () => {
      expect(formatThaiDate(testDate, "year")).toBe("2569");
    });

    it("should format date with time", () => {
      const dt = new Date(2026, 7, 20, 14, 30);
      expect(formatThaiDateTime(dt)).toContain("20 ส.ค. 2569 14:30 น.");
    });
  });
});
