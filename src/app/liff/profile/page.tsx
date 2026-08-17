import { getSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { LiffNav } from "@/components/liff/liff-nav";
import { LiffProfileCard } from "@/components/liff/liff-profile-card";
import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function logoutEmployeeAction() {
  "use server";
  await destroySession();
  redirect("/liff/connect");
}

export default async function LiffProfilePage() {
  const session = await getSession();

  if (!session || session.type !== "EMPLOYEE" || !session.employeeId) {
    redirect("/liff/connect");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    include: {
      company: {
        select: {
          name: true,
          code: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      position: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!employee) {
    redirect("/liff/connect");
  }

  const serializedEmployee = {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    dateOfBirth: employee.dateOfBirth.toISOString(),
    lineUserId: employee.lineUserId,
    avatarUrl: employee.avatarUrl,
    company: employee.company,
    department: employee.department,
    position: employee.position,
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] p-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center space-x-3 py-3 border-b border-[#e3e8ee]">
        <Link href="/liff/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#64748d] hover:text-[#0d253d] rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-base font-bold text-[#0d253d]">โปรไฟล์ของฉัน</h1>
      </div>

      {/* Profile Card with Live LINE Avatar */}
      <div className="mt-4">
        <LiffProfileCard employee={serializedEmployee} />
      </div>

      {/* Logout Action */}
      <div className="mt-6">
        <form action={logoutEmployeeAction}>
          <Button
            variant="outline"
            type="submit"
            className="w-full text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] h-11 text-xs font-semibold rounded-full cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" /> ออกจากระบบ / สลับบัญชี
          </Button>
        </form>
      </div>

      {/* Bottom Nav */}
      <LiffNav />
    </div>
  );
}
