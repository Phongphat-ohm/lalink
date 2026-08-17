import * as React from "react";
import { LiffProvider } from "@/components/liff";

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID}>
      {children}
    </LiffProvider>
  );
}
