import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { validateUploadFile } from "@/lib/storage/validator";
import { generateLeaveAttachmentKey } from "@/lib/storage/partition";
import { buildLeaveSubmittedFlex, buildLeaveApprovedFlex } from "@/lib/line";
import { generateCsvWithBom } from "@/features/report/csv-exporter";
import { sanitizeAuditDetails } from "@/lib/audit";

describe("Phase 12: End-to-End Leave Lifecycle Integration Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute the complete leave lifecycle seamlessly across all subsystems", async () => {
    // 1. Employee Context Setup
    const companyId = "comp-lalink-001";
    const employeeId = "emp-somchai-001";

    // 2. Leave Days Calculation with weekend & holiday exclusion
    const startDate = new Date("2026-08-14"); // Friday
    const endDate = new Date("2026-08-17"); // Monday (Weekend in between: Sat 15, Sun 16)
    const holidays = [{ date: new Date("2026-08-14"), name: "วันหยุดพิเศษ" }]; // Friday is a public holiday

    const calcResult = calculateLeaveDays({
      startDate,
      endDate,
      startPeriod: "FULL_DAY",
      endPeriod: "FULL_DAY",
      holidays,
    });

    // 4 calendar days - 2 weekend days - 1 holiday = 1 working day (Monday Aug 17)
    expect(calcResult.totalDays).toBe(1.0);
    expect(
      calcResult.breakdown.filter((b) => !b.isHoliday && !b.isWeekend).length,
    ).toBe(1);

    // 3. Attachment Upload Security Check (Magic bytes for Medical Certificate PDF)
    const pdfBuffer = new Uint8Array(
      Buffer.from("%PDF-1.7 mock content for leave certificate"),
    );
    const validation = validateUploadFile("medical_cert.pdf", pdfBuffer);

    expect(validation.isValid).toBe(true);
    expect(validation.mimeType).toBe("application/pdf");

    // Generate Tenant-Partitioned S3 Key
    const leaveRequestId = "req-202608-999";
    const objectKey = generateLeaveAttachmentKey({
      companyId,
      employeeId,
      leaveRequestId,
      fileId: "file-cert-01",
      extension: "pdf",
    });

    expect(objectKey).toBe(
      `companies/${companyId}/employees/${employeeId}/leave/${leaveRequestId}/file-cert-01.pdf`,
    );

    // 4. Notification Template Generation
    const flexData = {
      requestNumber: "LR-202608-0099",
      employeeName: "สมชาย ใจดี",
      leaveTypeName: "ลาพักร้อนประจำปี",
      startDate: "17/08/2026",
      endDate: "17/08/2026",
      totalDays: 1.0,
      reason: "ไปพักผ่อนต่างจังหวัด",
      companyName: "Lalink Co., Ltd.",
    };

    const submittedFlex = buildLeaveSubmittedFlex(flexData);
    expect(submittedFlex.type).toBe("flex");
    expect(submittedFlex.contents.header.backgroundColor).toBe("#0D9488"); // Brand Teal

    // 5. Admin Approval & Flex Notification
    const approvedFlex = buildLeaveApprovedFlex(flexData);
    expect(approvedFlex.contents.header.backgroundColor).toBe("#10B981"); // Emerald
    expect(JSON.stringify(approvedFlex)).toContain("อนุมัติใบลาเรียบร้อยแล้ว");

    // 6. Audit Trail Logging & Sanitization
    const auditData = sanitizeAuditDetails({
      action: "APPROVE_LEAVE",
      requestNumber: "LR-202608-0099",
      adminUserId: "user-admin-01",
      adminToken: "secret-bearer-token-12345",
    }) as any;

    expect(auditData.adminToken).toBe("[REDACTED]");
    expect(auditData.action).toBe("APPROVE_LEAVE");

    // 7. Report & CSV Export
    const headers = ["เลขที่ใบลา", "ชื่อพนักงาน", "จำนวนวัน", "สถานะ"];
    const rows = [
      [
        flexData.requestNumber,
        flexData.employeeName,
        flexData.totalDays,
        "อนุมัติแล้ว",
      ],
    ];
    const csvString = generateCsvWithBom(headers, rows);

    expect(csvString.startsWith("\uFEFF")).toBe(true);
    expect(csvString).toContain("LR-202608-0099");
    expect(csvString).toContain("สมชาย ใจดี");
    expect(csvString).toContain("อนุมัติแล้ว");
  });
});
