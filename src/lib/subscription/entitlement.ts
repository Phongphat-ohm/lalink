import { prisma } from "@/lib/database";
import { SubscriptionStatus } from "@prisma/client";

export interface EntitlementCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  planName: string;
  reason?: string;
}

export class EntitlementService {
  /**
   * Default fallback limits if no active subscription plan is found
   */
  static readonly DEFAULT_FALLBACK_LIMITS = {
    planCode: "FREE",
    planName: "Free Starter",
    maxEmployees: 20,
    maxAdmins: 2,
  };

  /**
   * Get active subscription and plan for a company
   */
  static async getCompanySubscription(companyId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
      },
    });

    if (!sub || !sub.plan || !sub.plan.isActive) {
      return null;
    }

    // Check if trial or subscription is valid
    const now = new Date();
    if (sub.status === SubscriptionStatus.TRIAL && sub.trialEndsAt && sub.trialEndsAt < now) {
      return { ...sub, isExpired: true };
    }
    if (sub.status === SubscriptionStatus.EXPIRED || sub.status === SubscriptionStatus.CANCELLED) {
      return { ...sub, isExpired: true };
    }
    if (sub.endDate && sub.endDate < now) {
      return { ...sub, isExpired: true };
    }

    return { ...sub, isExpired: false };
  }

  /**
   * Check if company can add more employees
   */
  static async checkEmployeeLimit(companyId: string): Promise<EntitlementCheckResult> {
    const [sub, currentCount] = await Promise.all([
      this.getCompanySubscription(companyId),
      prisma.employee.count({
        where: {
          companyId,
          status: { in: ["ACTIVE", "PROBATION"] },
        },
      }),
    ]);

    const maxLimit = sub && !sub.isExpired ? sub.plan.maxEmployees : this.DEFAULT_FALLBACK_LIMITS.maxEmployees;
    const planName = sub && !sub.isExpired ? sub.plan.name : this.DEFAULT_FALLBACK_LIMITS.planName;

    if (currentCount >= maxLimit) {
      return {
        allowed: false,
        currentCount,
        maxLimit,
        planName,
        reason: `บริษัทของคุณมีพนักงาน ${currentCount}/${maxLimit} คน ซึ่งเต็มโควตาของแพ็กเกจ ${planName} แล้ว กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มพนักงาน`,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxLimit,
      planName,
    };
  }

  /**
   * Check if company can add more admin users
   */
  static async checkAdminLimit(companyId: string): Promise<EntitlementCheckResult> {
    const [sub, currentCount] = await Promise.all([
      this.getCompanySubscription(companyId),
      prisma.user.count({
        where: {
          companyId,
          status: "ACTIVE",
        },
      }),
    ]);

    const maxLimit = sub && !sub.isExpired ? sub.plan.maxAdmins : this.DEFAULT_FALLBACK_LIMITS.maxAdmins;
    const planName = sub && !sub.isExpired ? sub.plan.name : this.DEFAULT_FALLBACK_LIMITS.planName;

    if (currentCount >= maxLimit) {
      return {
        allowed: false,
        currentCount,
        maxLimit,
        planName,
        reason: `บริษัทของคุณมีผู้ดูแลระบบ ${currentCount}/${maxLimit} บัญชี ซึ่งเต็มโควตาของแพ็กเกจ ${planName} แล้ว`,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxLimit,
      planName,
    };
  }
}
