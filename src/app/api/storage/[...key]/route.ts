import { getSession } from "@/lib/auth";
import { storageService } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    const params = await props.params;
    if (!params.key || params.key.length === 0) {
      return new Response("Invalid key", { status: 400 });
    }

    const key = params.key.map(decodeURIComponent).join("/");
    const session = await getSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Basic tenant isolation check: key typically starts with companies/{companyId}/...
    const parts = key.split("/");
    if (parts[0] === "companies" && parts[1]) {
      const companyId = parts[1];
      if (session.role !== "SUPER_ADMIN" && session.companyId !== companyId) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const buffer = await storageService.getObject(key);
    if (!buffer) {
      return new Response("File Not Found", { status: 404 });
    }

    // Determine Content-Type from extension
    const ext = key.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "csv") contentType = "text/csv; charset=utf-8";

    const filename = parts[parts.length - 1] || "attachment";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Storage API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
