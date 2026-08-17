"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/liff";
import { LoadingState } from "@/components/ui/loading-state";
import { checkLineAuthAction } from "@/features/employee";

export default function LiffEntryPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, idToken, login } = useLiff();

  React.useEffect(() => {
    async function resolveAuth() {
      if (!isReady) return;

      if (!isLoggedIn || !idToken) {
        // Not logged into LINE, redirect to connect form or prompt login
        router.replace("/liff/connect");
        return;
      }

      // Check if this LINE ID is already linked
      const result = await checkLineAuthAction(idToken);
      if (result.success && result.data?.isLinked) {
        router.replace("/liff/dashboard");
      } else {
        router.replace("/liff/connect");
      }
    }

    resolveAuth();
  }, [isReady, isLoggedIn, idToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <LoadingState message="กำลังตรวจสอบการเชื่อมต่อ LINE..." />
    </div>
  );
}
