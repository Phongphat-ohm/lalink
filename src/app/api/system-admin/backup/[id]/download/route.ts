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

    const fileBuffer = await BackupService.getBackupFile(backupLog.filename);
    if (!fileBuffer) {
      return new NextResponse("Backup file not found on disk", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/gzip");
    headers.set("Content-Disposition", `attachment; filename="${backupLog.filename}"`);
    headers.set("Content-Length", fileBuffer.length.toString());

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download Backup Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
