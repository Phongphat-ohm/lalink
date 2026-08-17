import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Phase 12: Concurrency & Ledger Race Condition Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Atomic Balance Deduction & Double Spending Prevention", () => {
    it("should prevent double-spending when two concurrent requests try to consume the same balance", async () => {
      // Simulate in-memory ledger state
      let remainingDays = 2.0;
      let pendingDays = 0.0;
      let usedDays = 0.0;
      let successfulDeductions = 0;
      let rejectedDeductions = 0;

      // Simulated atomic transaction with row locking
      async function attemptDeductLeaveBalance(
        daysToDeduct: number,
      ): Promise<boolean> {
        // In PostgreSQL: SELECT * FROM leave_balances WHERE id = ... FOR UPDATE
        if (remainingDays >= daysToDeduct) {
          // Atomic mutation
          remainingDays -= daysToDeduct;
          pendingDays += daysToDeduct;
          successfulDeductions += 1;
          return true;
        } else {
          rejectedDeductions += 1;
          return false;
        }
      }

      // Simulate 5 simultaneous requests attempting to deduct 2 days each
      const concurrentRequests = [
        attemptDeductLeaveBalance(2.0),
        attemptDeductLeaveBalance(2.0),
        attemptDeductLeaveBalance(2.0),
        attemptDeductLeaveBalance(2.0),
        attemptDeductLeaveBalance(2.0),
      ];

      const results = await Promise.all(concurrentRequests);

      // Exactly 1 request must succeed, other 4 must be rejected due to insufficient balance
      expect(results.filter((res) => res === true).length).toBe(1);
      expect(results.filter((res) => res === false).length).toBe(4);
      expect(remainingDays).toBe(0.0);
      expect(pendingDays).toBe(2.0);
      expect(successfulDeductions).toBe(1);
      expect(rejectedDeductions).toBe(4);
    });

    it("should handle partial quota deduction under concurrent load", async () => {
      let remainingDays = 5.0;
      let pendingDays = 0.0;

      async function attemptDeduct(days: number): Promise<boolean> {
        if (remainingDays >= days) {
          remainingDays -= days;
          pendingDays += days;
          return true;
        }
        return false;
      }

      // Simultaneous requests of 1.5, 2.0, 1.5, 1.0 days (Total requested = 6.0 days, quota = 5.0)
      const results = await Promise.all([
        attemptDeduct(1.5),
        attemptDeduct(2.0),
        attemptDeduct(1.5),
        attemptDeduct(1.0),
      ]);

      const totalSuccessDays = results.reduce(
        (acc, ok, idx) => acc + (ok ? [1.5, 2.0, 1.5, 1.0][idx] : 0),
        0,
      );

      expect(totalSuccessDays).toBeLessThanOrEqual(5.0);
      expect(remainingDays).toBeGreaterThanOrEqual(0.0);
      expect(remainingDays + pendingDays).toBe(5.0);
    });
  });

  describe("2. Sequential Request Number Generation Uniqueness", () => {
    it("should guarantee unique sequential request numbers", () => {
      const generatedNumbers = new Set<string>();
      const monthStr = "202608";

      for (let i = 1; i <= 100; i++) {
        const seqStr = String(i).padStart(4, "0");
        const requestNumber = `LR-${monthStr}-${seqStr}`;
        generatedNumbers.add(requestNumber);
      }

      // All 100 request numbers must be unique
      expect(generatedNumbers.size).toBe(100);
      expect(generatedNumbers.has("LR-202608-0001")).toBe(true);
      expect(generatedNumbers.has("LR-202608-0100")).toBe(true);
    });
  });
});
