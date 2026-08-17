import { describe, it, expect } from "vitest";
import {
  CompanyStatus,
  UserStatus,
  EmployeeStatus,
  LeaveRequestStatus,
  LeavePeriod,
  LeaveTransactionType,
  NotificationChannel,
  NotificationStatus,
  SubscriptionStatus,
  ActorType,
} from "@prisma/client";

describe("Phase 2: Database Schema & Entity Definitions", () => {
  it("should define all expected status enums properly", () => {
    expect(CompanyStatus.ACTIVE).toBe("ACTIVE");
    expect(CompanyStatus.SUSPENDED).toBe("SUSPENDED");
    expect(UserStatus.ACTIVE).toBe("ACTIVE");
    expect(EmployeeStatus.ACTIVE).toBe("ACTIVE");
    expect(EmployeeStatus.PROBATION).toBe("PROBATION");
    expect(EmployeeStatus.RESIGNED).toBe("RESIGNED");
  });

  it("should define complete leave lifecycle statuses", () => {
    expect(LeaveRequestStatus.DRAFT).toBe("DRAFT");
    expect(LeaveRequestStatus.PENDING).toBe("PENDING");
    expect(LeaveRequestStatus.APPROVED).toBe("APPROVED");
    expect(LeaveRequestStatus.REJECTED).toBe("REJECTED");
    expect(LeaveRequestStatus.CANCELLED).toBe("CANCELLED");
    expect(LeaveRequestStatus.WITHDRAWN).toBe("WITHDRAWN");
  });

  it("should define leave period options for half-day and full-day leaves", () => {
    expect(LeavePeriod.FULL_DAY).toBe("FULL_DAY");
    expect(LeavePeriod.HALF_DAY_AM).toBe("HALF_DAY_AM");
    expect(LeavePeriod.HALF_DAY_PM).toBe("HALF_DAY_PM");
  });

  it("should define all ledger transaction types for leave auditability", () => {
    expect(LeaveTransactionType.CREDIT).toBe("CREDIT");
    expect(LeaveTransactionType.DEBIT).toBe("DEBIT");
    expect(LeaveTransactionType.ADJUSTMENT).toBe("ADJUSTMENT");
    expect(LeaveTransactionType.REVERSAL).toBe("REVERSAL");
  });

  it("should define notification channels and actor types", () => {
    expect(NotificationChannel.LINE).toBe("LINE");
    expect(NotificationChannel.EMAIL).toBe("EMAIL");
    expect(NotificationStatus.SENT).toBe("SENT");
    expect(ActorType.USER).toBe("USER");
    expect(ActorType.EMPLOYEE).toBe("EMPLOYEE");
    expect(ActorType.SYSTEM).toBe("SYSTEM");
  });
});
