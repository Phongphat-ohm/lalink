import { describe, it, expect } from "vitest";
import {
  detectMagicBytes,
  validateUploadFile,
  sanitizeFilename,
  generateLeaveAttachmentKey,
  parseLeaveAttachmentKey,
  S3StorageService,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/storage";

describe("Phase 8: S3-Compatible Object Storage Subsystem", () => {
  describe("1. Magic Bytes & File Signature Verification", () => {
    it("should identify authentic PDF header (%PDF)", () => {
      // 0x25 0x50 0x44 0x46 (%PDF)
      const pdfBuffer = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35,
      ]);
      expect(detectMagicBytes(pdfBuffer)).toBe("application/pdf");
    });

    it("should identify authentic PNG header", () => {
      // 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      const pngBuffer = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
      ]);
      expect(detectMagicBytes(pngBuffer)).toBe("image/png");
    });

    it("should identify authentic JPEG header (FF D8 FF)", () => {
      const jpgBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMagicBytes(jpgBuffer)).toBe("image/jpeg");
    });

    it("should reject malicious files disguised with valid extensions (e.g. Shell script disguised as .png)", () => {
      // String "#!/bin/bash" as bytes
      const fakePng = new TextEncoder().encode("#!/bin/bash\necho 'hacked'");
      const result = validateUploadFile("document.png", fakePng, "image/png");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("รูปแบบไฟล์ไม่ถูกต้อง");
    });

    it("should reject executable disguised as .pdf", () => {
      // MZ header for Windows EXE (0x4D 0x5A)
      const fakePdf = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      const result = validateUploadFile(
        "medical_certificate.pdf",
        fakePdf,
        "application/pdf",
      );

      expect(result.isValid).toBe(false);
    });
  });

  describe("2. File Size & Filename Sanitization", () => {
    it("should reject files exceeding 5MB limit", () => {
      const oversizedBuffer = new Uint8Array(MAX_FILE_SIZE_BYTES + 100);
      // Valid PDF header
      oversizedBuffer[0] = 0x25;
      oversizedBuffer[1] = 0x50;
      oversizedBuffer[2] = 0x44;
      oversizedBuffer[3] = 0x46;

      const result = validateUploadFile("large.pdf", oversizedBuffer);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ขนาดไฟล์เกินกำหนด");
    });

    it("should reject empty files (0 bytes)", () => {
      const emptyBuffer = new Uint8Array(0);
      const result = validateUploadFile("empty.pdf", emptyBuffer);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ไฟล์ว่างเปล่า");
    });

    it("should sanitize filenames and strip directory traversal attacks", () => {
      expect(sanitizeFilename("../../../etc/passwd.pdf")).toBe("passwd.pdf");
      expect(sanitizeFilename("..\\..\\windows\\system32.jpg")).toBe(
        "system32.jpg",
      );
      expect(sanitizeFilename("medical_report_(1).pdf")).toBe(
        "medical_report__1_.pdf",
      );
    });
  });

  describe("3. Tenant Partitioning & S3 Object Key Management", () => {
    it("should generate structured tenant-partitioned object key", () => {
      const key = generateLeaveAttachmentKey({
        companyId: "comp_123",
        employeeId: "emp_456",
        leaveRequestId: "lr_789",
        fileId: "file_abc",
        extension: "pdf",
      });

      expect(key).toBe(
        "companies/comp_123/employees/emp_456/leave/lr_789/file_abc.pdf",
      );
    });

    it("should accurately parse tenant-partitioned object key", () => {
      const key =
        "companies/comp_123/employees/emp_456/leave/lr_789/file_abc.pdf";
      const parsed = parseLeaveAttachmentKey(key);

      expect(parsed.isValid).toBe(true);
      expect(parsed.companyId).toBe("comp_123");
      expect(parsed.employeeId).toBe("emp_456");
      expect(parsed.leaveRequestId).toBe("lr_789");
      expect(parsed.fileId).toBe("file_abc");
    });

    it("should mark invalid object keys as invalid", () => {
      const parsed = parseLeaveAttachmentKey("public/uploads/file.pdf");
      expect(parsed.isValid).toBe(false);
      expect(parsed.companyId).toBeNull();
    });
  });

  describe("4. Storage Service & Pre-signed URL Generation", () => {
    it("should generate pre-signed download and upload URLs", async () => {
      const service = new S3StorageService({
        bucketName: "test-bucket",
      });

      const downloadUrl = await service.getSignedDownloadUrl(
        "companies/c1/employees/e1/leave/l1/f1.pdf",
        600,
      );
      expect(downloadUrl).toBeDefined();
      expect(typeof downloadUrl).toBe("string");
      expect(downloadUrl).toContain("f1.pdf");

      const uploadUrl = await service.getSignedUploadUrl(
        "companies/c1/employees/e1/leave/l1/f1.pdf",
        "application/pdf",
        600,
      );
      expect(uploadUrl).toBeDefined();
      expect(typeof uploadUrl).toBe("string");
      expect(uploadUrl).toContain("f1.pdf");
    });

    it("should resolve bucketName correctly from S3_BUCKET env variable", () => {
      const prevEnv = process.env.S3_BUCKET;
      process.env.S3_BUCKET = "custom-prod-bucket";
      const service = new S3StorageService();
      expect(service).toBeDefined();
      if (prevEnv !== undefined) {
        process.env.S3_BUCKET = prevEnv;
      } else {
        delete process.env.S3_BUCKET;
      }
    });
  });
});
