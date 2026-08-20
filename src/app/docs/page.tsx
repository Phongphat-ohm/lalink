import { Metadata } from "next";
import { DocsView } from "@/components/docs/docs-view";

export const metadata: Metadata = {
  title: "ศูนย์เอกสารคู่มือ & API Reference | LALINK",
  description:
    "คู่มือการใช้งานระบบ LALINK, ระบบ LINE LIFF, การบริหารจัดการสำหรับ HR, เอกสาร REST API และระบบ Webhook Integration",
};

export default function DocsPage() {
  return <DocsView />;
}
