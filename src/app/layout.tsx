import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LALINK - ระบบลางานออนไลน์",
  description: "ระบบจัดการการลาออนไลน์สำหรับองค์กร",
};

import { Toaster } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-kanit)]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
