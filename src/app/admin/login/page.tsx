"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { loginAdminAction } from "@/features/auth";
import { Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await loginAdminAction(null, formData);

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      if (result.errors) {
        setFieldErrors(result.errors);
      }
      return;
    }

    const destination = from || result.data?.redirectUrl || "/admin/dashboard";
    router.push(destination);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md shadow-[0_8px_24px_rgba(0,55,112,0.08)] border-[#e3e8ee] bg-white rounded-2xl">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-md">
          <img
            src="/logo.png"
            alt="LALINK Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-[#0d253d] tracking-tight display-title">
          ผู้ดูแลระบบ LALINK
        </CardTitle>
        <CardDescription className="text-xs text-[#64748d]">
          ระบบจัดการวันลาและสิทธิ์การอนุมัติระดับองค์กร
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-[#0d253d]"
            >
              อีเมลผู้ใช้งาน
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
              disabled={isLoading}
              className="h-10 rounded-xl"
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-[#0d253d]"
              >
                รหัสผ่าน
              </label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="h-10 rounded-xl"
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-[#ea2261] font-medium mt-1">
                {fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#533afd] hover:bg-[#4434d4] h-11 text-sm font-semibold shadow-md mt-2 rounded-full text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-[#64748d]">
          ยังไม่มีบัญชีองค์กร?{" "}
          <Link
            href="/register"
            className="text-[#533afd] font-semibold hover:underline"
          >
            สมัครสมาชิกองค์กรใหม่
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient p-4">
      <Suspense
        fallback={<LoadingState message="กำลังโหลดหน้าเข้าสู่ระบบ..." />}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
