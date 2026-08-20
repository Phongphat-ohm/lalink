import { FileValidationResult } from "./types";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

/**
 * Detect MIME type using file signature (Magic Bytes)
 */
export function detectMagicBytes(buffer: Uint8Array): string | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  return null;
}

/**
 * Validate upload file buffer, size, extension, and magic bytes
 */
export function validateUploadFile(
  filename: string,
  buffer: Uint8Array,
  declaredMimeType?: string,
): FileValidationResult {
  // 1. Check File Size
  if (buffer.byteLength === 0) {
    return {
      isValid: false,
      error: "ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่ถูกต้อง",
    };
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `ขนาดไฟล์เกินกำหนด (สูงสุด ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB) กรุณาเลือกไฟล์ใหม่หรือลดขนาดไฟล์แล้วลองอัปโหลดอีกครั้ง`,
    };
  }

  // 2. Check File Extension
  const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : "";

  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    return {
      isValid: false,
      error: `นามสกุลไฟล์ไม่ถูกต้อง รองรับเฉพาะ: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`,
    };
  }

  // 3. Check Magic Bytes (File Signature)
  const detectedMime = detectMagicBytes(buffer);
  if (!detectedMime) {
    return {
      isValid: false,
      error: "รูปแบบไฟล์ไม่ถูกต้อง หรือเนื้อหาไฟล์ไม่ตรงกับนามสกุล",
    };
  }

  // 4. Verify Extension matches Detected MIME
  if (
    (ext === "pdf" && detectedMime !== "application/pdf") ||
    (ext === "png" && detectedMime !== "image/png") ||
    ((ext === "jpg" || ext === "jpeg") && detectedMime !== "image/jpeg")
  ) {
    return {
      isValid: false,
      error:
        "เนื้อหาของไฟล์ไม่ตรงกับนามสกุลไฟล์ที่ระบุ (ตรวจพบความไม่สอดคล้อง)",
    };
  }

  return {
    isValid: true,
    mimeType: detectedMime,
    extension: ext === "jpeg" ? "jpg" : ext,
  };
}

/**
 * Sanitize filename to prevent directory traversal and special character injection
 */
export function sanitizeFilename(filename: string): string {
  // Extract basename without path traversal
  const basename = filename.replace(/^.*[\\/]/, "");
  // Replace illegal characters with underscore
  return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
}
