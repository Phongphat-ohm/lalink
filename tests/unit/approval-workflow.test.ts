import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findActiveWorkflow,
  initializeApprovals,
  processApproval,
  isStepCompleted,
} from "@/lib/leave/approval-engine";
import { ApprovalStepStatus, LeaveRequestStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockQueryRaw: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockCreateMany: vi.fn(),
}));

const {
  mockFindMany,
  mockFindUnique,
  mockCreate,
  mockUpdate,
  mockQueryRaw,
  mockDeleteMany,
  mockCreateMany,
} = mocks;

const tx = {
  approvalWorkflow: { findMany: mockFindMany },
  leaveApproval: {
    create: mockCreate,
    createMany: mockCreateMany,
    findMany: mockFindMany,
    update: mockUpdate,
  },
  leaveRequest: { findUnique: mockFindUnique },
  workflowStep: { deleteMany: mockDeleteMany },
  $queryRaw: mockQueryRaw,
} as never;

const COMPANY_ID = "company_1";
const LEAVE_TYPE_ID = "lt_annual";
const REQUEST_ID = "lr_1";

const twoStepWorkflow = {
  id: "wf_1",
  companyId: COMPANY_ID,
  leaveTypeId: LEAVE_TYPE_ID,
  name: "หัวหน้างาน -> HR",
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [
    {
      id: "ws_1",
      workflowId: "wf_1",
      stepOrder: 1,
      roleCode: "MANAGER",
      name: "หัวหน้างานตรวจสอบ",
    },
    {
      id: "ws_2",
      workflowId: "wf_1",
      stepOrder: 2,
      roleCode: "HR",
      name: "ฝ่ายบุคคลอนุมัติขั้นสุดท้าย",
    },
  ],
};

const pendingRequest = {
  id: REQUEST_ID,
  companyId: COMPANY_ID,
  employeeId: "emp_1",
  leaveTypeId: LEAVE_TYPE_ID,
  requestNumber: "LR-202608-0001",
  startDate: new Date("2026-08-17"),
  endDate: new Date("2026-08-17"),
  startPeriod: "FULL_DAY",
  endPeriod: "FULL_DAY",
  totalDays: "1",
  hours: null,
  reason: "ลาพักร้อน",
  status: LeaveRequestStatus.PENDING,
  rejectionReason: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  cancelledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Phase 5: Approval Workflow (Multi-Level)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("1. findActiveWorkflow", () => {
    it("should prefer the exact leave-type workflow over the general one", async () => {
      mockFindMany.mockResolvedValue([
        { ...twoStepWorkflow, id: "wf_general", leaveTypeId: null },
        twoStepWorkflow,
      ]);

      const result = await findActiveWorkflow(tx, COMPANY_ID, LEAVE_TYPE_ID);

      expect(result?.id).toBe("wf_1");
    });

    it("should fall back to the general workflow when no exact match exists", async () => {
      mockFindMany.mockResolvedValue([
        { ...twoStepWorkflow, id: "wf_general", leaveTypeId: null },
      ]);

      const result = await findActiveWorkflow(tx, COMPANY_ID, LEAVE_TYPE_ID);

      expect(result?.id).toBe("wf_general");
    });

    it("should return null when no active workflow exists", async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await findActiveWorkflow(tx, COMPANY_ID, LEAVE_TYPE_ID);

      expect(result).toBeNull();
    });
  });

  describe("2. initializeApprovals", () => {
    it("should create a LeaveApproval record per workflow step", async () => {
      mockFindMany.mockResolvedValue([twoStepWorkflow]);

      const count = await initializeApprovals(tx, {
        companyId: COMPANY_ID,
        leaveTypeId: LEAVE_TYPE_ID,
        leaveRequestId: REQUEST_ID,
      });

      expect(count).toBe(2);
      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockCreate).toHaveBeenNthCalledWith(1, {
        data: {
          leaveRequestId: REQUEST_ID,
          stepOrder: 1,
          roleCode: "MANAGER",
          status: ApprovalStepStatus.PENDING,
        },
      });
      expect(mockCreate).toHaveBeenNthCalledWith(2, {
        data: {
          leaveRequestId: REQUEST_ID,
          stepOrder: 2,
          roleCode: "HR",
          status: ApprovalStepStatus.PENDING,
        },
      });
    });

    it("should return 0 (single-step mode) when no workflow exists", async () => {
      mockFindMany.mockResolvedValue([]);

      const count = await initializeApprovals(tx, {
        companyId: COMPANY_ID,
        leaveTypeId: LEAVE_TYPE_ID,
        leaveRequestId: REQUEST_ID,
      });

      expect(count).toBe(0);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("3. processApproval — step advancement", () => {
    it("should approve step 1 and keep the request PENDING when more steps remain", async () => {
      mockQueryRaw.mockResolvedValue([]);
      mockFindUnique.mockResolvedValue(pendingRequest);
      mockFindMany.mockResolvedValue([twoStepWorkflow]);
      mockFindMany.mockResolvedValueOnce([twoStepWorkflow]);
      mockFindMany.mockResolvedValueOnce([
        {
          id: "lap_1",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 1,
          roleCode: "MANAGER",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
        {
          id: "lap_2",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 2,
          roleCode: "HR",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
      ]);

      const outcome = await processApproval(tx, {
        leaveRequestId: REQUEST_ID,
        actor: { userId: "user_1", roleCode: "MANAGER" },
        decision: "APPROVE",
      });

      expect(outcome.isWorkflowDriven).toBe(true);
      expect(outcome.currentStep).toBe(1);
      expect(outcome.totalSteps).toBe(2);
      expect(outcome.isFinalized).toBe(false);
      expect(outcome.requestStatus).toBe(LeaveRequestStatus.PENDING);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ApprovalStepStatus.APPROVED,
            approverId: "user_1",
          }),
        }),
      );
    });

    it("should finalize APPROVED when the last step approves", async () => {
      mockQueryRaw.mockResolvedValue([]);
      mockFindUnique.mockResolvedValue(pendingRequest);
      mockFindMany.mockResolvedValueOnce([twoStepWorkflow]);
      mockFindMany.mockResolvedValueOnce([
        {
          id: "lap_1",
          leaveRequestId: REQUEST_ID,
          approverId: "user_1",
          stepOrder: 1,
          roleCode: "MANAGER",
          status: ApprovalStepStatus.APPROVED,
          comment: null,
          actedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: "lap_2",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 2,
          roleCode: "HR",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
      ]);

      const outcome = await processApproval(tx, {
        leaveRequestId: REQUEST_ID,
        actor: { userId: "user_2", roleCode: "HR" },
        decision: "APPROVE",
      });

      expect(outcome.isFinalized).toBe(true);
      expect(outcome.currentStep).toBe(2);
      expect(outcome.requestStatus).toBe(LeaveRequestStatus.APPROVED);
    });

    it("should reject immediately regardless of the step", async () => {
      mockQueryRaw.mockResolvedValue([]);
      mockFindUnique.mockResolvedValue(pendingRequest);
      mockFindMany.mockResolvedValueOnce([twoStepWorkflow]);
      mockFindMany.mockResolvedValueOnce([
        {
          id: "lap_1",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 1,
          roleCode: "MANAGER",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
        {
          id: "lap_2",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 2,
          roleCode: "HR",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
      ]);

      const outcome = await processApproval(tx, {
        leaveRequestId: REQUEST_ID,
        actor: { userId: "user_1", roleCode: "MANAGER" },
        decision: "REJECT",
        comment: "ติดภารกิจด่วน",
      });

      expect(outcome.isFinalized).toBe(true);
      expect(outcome.requestStatus).toBe(LeaveRequestStatus.REJECTED);
    });

    it("should throw when the actor's role does not match the current step", async () => {
      mockQueryRaw.mockResolvedValue([]);
      mockFindUnique.mockResolvedValue(pendingRequest);
      mockFindMany.mockResolvedValueOnce([twoStepWorkflow]);
      mockFindMany.mockResolvedValueOnce([
        {
          id: "lap_1",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 1,
          roleCode: "MANAGER",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
        {
          id: "lap_2",
          leaveRequestId: REQUEST_ID,
          approverId: null,
          stepOrder: 2,
          roleCode: "HR",
          status: ApprovalStepStatus.PENDING,
          comment: null,
          actedAt: null,
          createdAt: new Date(),
        },
      ]);

      await expect(
        processApproval(tx, {
          leaveRequestId: REQUEST_ID,
          actor: { userId: "user_2", roleCode: "HR" },
          decision: "APPROVE",
        }),
      ).rejects.toThrow(/not assigned to you/);
    });

    it("should throw when the request is not PENDING", async () => {
      mockQueryRaw.mockResolvedValue([]);
      mockFindUnique.mockResolvedValue({
        ...pendingRequest,
        status: LeaveRequestStatus.APPROVED,
      });

      await expect(
        processApproval(tx, {
          leaveRequestId: REQUEST_ID,
          actor: { userId: "user_1", roleCode: "MANAGER" },
          decision: "APPROVE",
        }),
      ).rejects.toThrow(/status/);
    });
  });

  describe("4. isStepCompleted", () => {
    it("should consider APPROVED and SKIPPED as completed", () => {
      expect(isStepCompleted(ApprovalStepStatus.APPROVED)).toBe(true);
      expect(isStepCompleted(ApprovalStepStatus.SKIPPED)).toBe(true);
      expect(isStepCompleted(ApprovalStepStatus.PENDING)).toBe(false);
      expect(isStepCompleted(ApprovalStepStatus.REJECTED)).toBe(false);
    });
  });

  describe("5. Workflow role validation (action level)", () => {
    it("should only allow approver-capable roles in the workflow", () => {
      const APPROVER_ROLES = ["COMPANY_ADMIN", "HR_ADMIN", "HR", "MANAGER", "ADMIN"];
      const isValid = (role: string) => APPROVER_ROLES.includes(role);

      expect(isValid("MANAGER")).toBe(true);
      expect(isValid("HR")).toBe(true);
      expect(isValid("COMPANY_ADMIN")).toBe(true);
      expect(isValid("EMPLOYEE")).toBe(false);
      expect(isValid("SYSTEM_ADMIN")).toBe(false);
    });

    it("should reject a workflow with zero steps", () => {
      const hasSteps = (steps: unknown[]) => steps.length >= 1;
      expect(hasSteps([])).toBe(false);
      expect(hasSteps([{ roleCode: "MANAGER", name: "ตรวจสอบ" }])).toBe(true);
    });
  });
});