import { sanitizeFilename } from "./validator";

export interface LeaveAttachmentKeyParams {
  companyId: string;
  employeeId: string;
  leaveRequestId: string;
  fileId: string;
  extension: string;
}

/**
 * Generate Tenant Partitioned S3 Object Key:
 * companies/{companyId}/employees/{employeeId}/leave/{leaveRequestId}/{fileId}.{ext}
 */
export function generateLeaveAttachmentKey({
  companyId,
  employeeId,
  leaveRequestId,
  fileId,
  extension,
}: LeaveAttachmentKeyParams): string {
  const safeExt = extension.replace(/^\./, "").toLowerCase();
  return `companies/${companyId}/employees/${employeeId}/leave/${leaveRequestId}/${fileId}.${safeExt}`;
}

/**
 * Parse an S3 Object Key to extract tenant and ownership information
 */
export function parseLeaveAttachmentKey(key: string): {
  companyId: string | null;
  employeeId: string | null;
  leaveRequestId: string | null;
  fileId: string | null;
  isValid: boolean;
} {
  const parts = key.split("/");
  // Expected structure: companies / {companyId} / employees / {employeeId} / leave / {leaveRequestId} / {fileId}.{ext}
  if (
    parts.length === 7 &&
    parts[0] === "companies" &&
    parts[2] === "employees" &&
    parts[4] === "leave"
  ) {
    const fileWithExt = parts[6];
    const fileId = fileWithExt.split(".")[0];

    return {
      companyId: parts[1],
      employeeId: parts[3],
      leaveRequestId: parts[5],
      fileId,
      isValid: true,
    };
  }

  return {
    companyId: null,
    employeeId: null,
    leaveRequestId: null,
    fileId: null,
    isValid: false,
  };
}
