import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database";
import { BackupService } from "@/lib/backup/backup-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    const backupLog = await prisma.backupLog.findUnique({
      where: { id },
    });

    if (!backupLog) {
      return new NextResponse("Backup not found", { status: 404 });
    }

    // Direct verified stream from local cache or S3
    const fileBuffer = await BackupService.getBackupFile(backupLog.filename);
    if (!fileBuffer || fileBuffer.length === 0) {
      return new NextResponse("Backup file not found or empty", { status: 404 });
    }

    const headers = new Headers();
    const isZip = backupLog.filename.endsWith(".zip");
    headers.set("Content-Type", isZip ? "application/zip" : "application/gzip");
    headers.set("Content-Disposition", `attachment; filename="${backupLog.filename}"`);
    headers.set("Content-Length", fileBuffer.length.toString());
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download Backup Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
