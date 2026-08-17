"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Building,
  Sparkles,
  Share2,
} from "lucide-react";

interface CompanyQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  companyCode: string;
}

export function CompanyQrModal({
  open,
  onOpenChange,
  companyName,
  companyCode,
}: CompanyQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const connectUrl = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/liff/connect?company=${companyCode}`;
    }
    return `https://lalink.app/liff/connect?company=${companyCode}`;
  }, [companyCode]);

  React.useEffect(() => {
    if (!open) return;

    // Generate high-resolution QR data URL
    QRCode.toDataURL(
      connectUrl,
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#0d253d",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      },
    );
  }, [open, connectUrl]);

  // Download high-resolution branded poster PNG
  function handleDownloadPng() {
    if (!qrDataUrl) return;

    // Create an offscreen canvas to compose a professional branded card
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1050;

    // 1. Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Top Header Accent
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#533afd");
    gradient.addColorStop(1, "#4434d4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 180);

    // 3. Header Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Kanit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LALINK", canvas.width / 2, 75);

    ctx.font = "20px Kanit, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(
      "ระบบบริหารจัดการวันลาออนไลน์ ผ่าน LINE",
      canvas.width / 2,
      115,
    );

    // 4. Company Info Card Box
    ctx.fillStyle = "#f6f9fc";
    ctx.strokeStyle = "#e3e8ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(60, 220, 680, 750, 32);
    ctx.fill();
    ctx.stroke();

    // 5. Company Name & Code
    ctx.fillStyle = "#0d253d";
    ctx.font = "bold 32px Kanit, sans-serif";
    ctx.fillText(companyName, canvas.width / 2, 285);

    ctx.fillStyle = "#533afd";
    ctx.font = "bold 24px monospace";
    ctx.fillText(`CODE: ${companyCode}`, canvas.width / 2, 325);

    // 6. Draw QR Code Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrDataUrl;
    img.onload = () => {
      ctx.drawImage(img, 175, 360, 450, 450);

      // 7. Instructions
      ctx.fillStyle = "#64748d";
      ctx.font = "22px Kanit, sans-serif";
      ctx.fillText(
        "สแกนด้วยกล้อง LINE เพื่อเชื่อมต่อบัญชีเข้ากับองค์กร",
        canvas.width / 2,
        860,
      );

      ctx.fillStyle = "#a8c3de";
      ctx.font = "16px monospace";
      ctx.fillText(connectUrl, canvas.width / 2, 905);

      // Trigger download
      const link = document.createElement("a");
      link.download = `LALINK_QR_${companyCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  }

  // Print poster
  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code เชื่อมต่อ LINE - ${companyName}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              color: #0d253d;
              text-align: center;
            }
            .card {
              border: 3px solid #e3e8ee;
              border-radius: 32px;
              padding: 40px;
              max-width: 520px;
              width: 100%;
              box-sizing: border-box;
            }
            .title { font-size: 32px; font-weight: 800; color: #533afd; margin: 0; }
            .company { font-size: 24px; font-weight: bold; margin: 16px 0 8px; }
            .code-badge {
              display: inline-block;
              background: #533afd15;
              color: #533afd;
              font-family: monospace;
              font-weight: bold;
              font-size: 20px;
              padding: 6px 18px;
              border-radius: 999px;
            }
            .qr { width: 320px; height: 320px; margin: 24px 0; }
            .desc { font-size: 16px; color: #64748d; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">LALINK</h1>
            <p style="color: #64748d; margin: 4px 0 20px;">ระบบบริหารจัดการวันลาออนไลน์</p>
            <div class="company">${companyName}</div>
            <div class="code-badge">รหัสบริษัท: ${companyCode}</div>
            <br />
            <img src="${qrDataUrl}" class="qr" alt="QR Code" />
            <p class="desc"><strong>สแกนด้วยกล้อง LINE</strong><br/>เพื่อผูกบัญชีเข้ากับองค์กร</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-md rounded-3xl p-6 text-center"
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-bold text-[#0d253d] flex items-center justify-center">
            <QrCode className="h-5 w-5 text-[#533afd] mr-2" />
            QR Code เชื่อมต่อ LINE องค์กร
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748d]">
            ให้พนักงานสแกนผ่านแอป LINE เพื่อผูกบัญชีและเริ่มใช้งานระบบลางาน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* QR Display Card */}
          <div className="bg-[#f6f9fc] border border-[#e3e8ee] rounded-2xl p-5 shadow-xs flex flex-col items-center">
            <div className="space-y-1 mb-3">
              <h3 className="font-bold text-sm text-[#0d253d]">
                {companyName}
              </h3>
              <Badge className="bg-[#533afd]/10 text-[#533afd] border-[#533afd]/20 font-mono font-bold text-xs px-3 py-0.5 rounded-full">
                รหัสบริษัท: {companyCode}
              </Badge>
            </div>

            {qrDataUrl ? (
              <div className="bg-white p-3.5 rounded-2xl border border-[#e3e8ee] shadow-sm relative group">
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${companyCode}`}
                  className="w-52 h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-white rounded-2xl border border-[#e3e8ee]">
                <span className="text-xs text-[#64748d]">
                  กำลังสร้าง QR Code...
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#64748d] mt-3">
              พนักงานสามารถเปิดแอป LINE แล้วสแกนรูปนี้เพื่อเชื่อมต่อทันที
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={handleDownloadPng}
              className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs h-10 font-semibold shadow-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              ดาวน์โหลด PNG
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="rounded-full border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc] text-xs h-10 font-semibold"
            >
              <Printer className="h-4 w-4 mr-1.5 text-[#533afd]" />
              พิมพ์โปสเตอร์ A4
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
            className="w-full text-xs text-[#64748d] hover:text-[#533afd] h-8 rounded-full"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copied
              ? "คัดลอกลิงก์สำเร็จแล้ว!"
              : "คัดลอก Direct Link สำหรับส่งในแชท LINE"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
