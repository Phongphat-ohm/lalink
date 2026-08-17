"use server";

import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function getNotificationsAction(limit = 20): Promise<
  ActionResult<
    Array<{
      id: string;
      title: string;
      message: string;
      status: string;
      createdAt: string;
      sentAt: string | null;
      payload: any;
    }>
  >
> {
  try {
    const tenant = await requireTenantContext();

    const recipientId =
      tenant.type === "EMPLOYEE" ? tenant.employeeId : tenant.userId;

    if (!recipientId) {
      return { success: true, data: [] };
    }

    const notifications = await prisma.notification.findMany({
      where: {
        companyId: tenant.companyId,
        recipientId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        status: n.status,
        createdAt: n.createdAt.toISOString(),
        sentAt: n.sentAt ? n.sentAt.toISOString() : null,
        payload: n.payload,
      })),
    };
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return {
      success: false,
      message: "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้",
      data: [],
    };
  }
}
