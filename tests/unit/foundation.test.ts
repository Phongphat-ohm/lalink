import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Phase 1: Project Foundation & Core Infrastructure", () => {
  it("should merge tailwind classes properly using cn()", () => {
    const result = cn("p-4 text-sm", "text-base", {
      "bg-teal-600": true,
      "bg-red-500": false,
    });
    expect(result).toContain("p-4");
    expect(result).toContain("text-base");
    expect(result).toContain("bg-teal-600");
    expect(result).not.toContain("bg-red-500");
  });

  it("should handle conditional and falsy values gracefully in cn()", () => {
    const result = cn("flex", null, undefined, false, "items-center");
    expect(result).toBe("flex items-center");
  });
});
