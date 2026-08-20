"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

export interface BlockedIpRecord {
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
}

const SETTING_KEY = "SECURITY_IP_BLOCKLIST";

/**
 * Super Admin: Get all blocked IPs
 */
export async function getBlockedIpsAction(): Promise<ActionResult<BlockedIpRecord[]>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const blockedIps: BlockedIpRecord[] = setting?.value ? JSON.parse(setting.value) : [];
    return { success: true, data: blockedIps };
  } catch (error) {
    console.error("Get Blocked IPs Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการดึงรายการ IP", data: [] };
  }
}

/**
 * Super Admin: Block an IP Address
 */
export async function blockIpAddressAction(
  ipAddress: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin only" };
    }

    const cleanIp = ipAddress.trim();
    if (!cleanIp) {
      return { success: false, message: "กรุณาระบุหมายเลข IP Address" };
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const currentList: BlockedIpRecord[] = setting?.value ? JSON.parse(setting.value) : [];

    if (currentList.some((item) => item.ipAddress === cleanIp)) {
      return { success: false, message: `IP "${cleanIp}" ถูกบล็อกในระบบอยู่แล้ว` };
    }

    const newRecord: BlockedIpRecord = {
      ipAddress: cleanIp,
      reason: reason || "Manual block by Super Admin",
      blockedAt: new Date().toISOString(),
      blockedBy: session.userId,
    };

    const updatedList = [newRecord, ...currentList];

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      create: {
        category: "SECURITY",
        key: SETTING_KEY,
        value: JSON.stringify(updatedList),
        description: "Global IP Blocklist for suspicious brute force attackers",
      },
      update: {
        value: JSON.stringify(updatedList),
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "BLOCK_IP",
      resource: "Security",
      details: { ipAddress: cleanIp, reason },
    });

    revalidatePath("/system-admin/security");

    return {
      success: true,
      message: `บล็อกหมายเลข IP "${cleanIp}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Block IP Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการบล็อก IP" };
  }
}

/**
 * Super Admin: Unblock an IP Address
 */
export async function unblockIpAddressAction(ipAddress: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin only" };
    }

    const cleanIp = ipAddress.trim();

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return { success: true, message: "ปลดบล็อกเรียบร้อยแล้ว" };
    }

    const currentList: BlockedIpRecord[] = setting.value ? JSON.parse(setting.value) : [];
    const updatedList = currentList.filter((item) => item.ipAddress !== cleanIp);

    await prisma.systemSetting.update({
      where: { key: SETTING_KEY },
      data: { value: JSON.stringify(updatedList) },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "UNBLOCK_IP",
      resource: "Security",
      details: { ipAddress: cleanIp },
    });

    revalidatePath("/system-admin/security");

    return {
      success: true,
      message: `ปลดบล็อกหมายเลข IP "${cleanIp}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Unblock IP Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการปลดบล็อก IP" };
  }
}
