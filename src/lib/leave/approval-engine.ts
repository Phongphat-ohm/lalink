import {
  ApprovalStepStatus,
  LeaveRequestStatus,
  type ApprovalWorkflow,
  type Prisma,
  type WorkflowStep,
} from "@prisma/client";

export type ApprovalDecision = "APPROVE" | "REJECT";

export interface ApprovalActor {
  userId: string;
  roleCode: string;
}

export interface ApprovalOutcome {
  /** Next status of the leave request. */
  requestStatus: LeaveRequestStatus;
  /** True when a multi-level workflow drives this request. */
  isWorkflowDriven: boolean;
  /** 1-based step order that was just acted upon. */
  currentStep: number;
  /** Total number of workflow steps (1 for single-step fallback). */
  totalSteps: number;
  /** True when this action finalizes the request (final approve or any reject). */
  isFinalized: boolean;
}

interface WorkflowWithSteps extends ApprovalWorkflow {
  steps: WorkflowStep[];
}

/**
 * Finds the active approval workflow for a company + leave type.
 * Prefers an exact leave-type match, falling back to the general
 * workflow (leaveTypeId = null).
 */
export async function findActiveWorkflow(
  tx: Prisma.TransactionClient,
  companyId: string,
  leaveTypeId: string,
): Promise<WorkflowWithSteps | null> {
  const workflows = await tx.approvalWorkflow.findMany({
    where: { companyId, isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  if (workflows.length === 0) return null;

  const exact = workflows.find((w) => w.leaveTypeId === leaveTypeId);
  if (exact) return exact;

  const general = workflows.find((w) => w.leaveTypeId === null);
  if (general) return general;

  // Fall back to the first active workflow.
  return workflows[0];
}

/**
 * Creates `LeaveApproval` records for every step of the active
 * workflow. Returns the number of steps created (0 = no workflow
 * configured, meaning single-step behavior).
 */
export async function initializeApprovals(
  tx: Prisma.TransactionClient,
  params: {
    companyId: string;
    leaveTypeId: string;
    leaveRequestId: string;
  },
): Promise<number> {
  const workflow = await findActiveWorkflow(
    tx,
    params.companyId,
    params.leaveTypeId,
  );

  if (!workflow || workflow.steps.length === 0) return 0;

  for (const step of workflow.steps) {
    await tx.leaveApproval.create({
      data: {
        leaveRequestId: params.leaveRequestId,
        stepOrder: step.stepOrder,
        roleCode: step.roleCode,
        status: ApprovalStepStatus.PENDING,
      },
    });
  }

  return workflow.steps.length;
}

/**
 * Processes an approval/rejection decision against a leave request.
 *
 * Must be called inside a `prisma.$transaction` so balance updates made
 * by the caller stay atomic with workflow advancement.
 *
 * @throws Error when the actor is not authorized for the current step.
 */
export async function processApproval(
  tx: Prisma.TransactionClient,
  params: {
    leaveRequestId: string;
    actor: ApprovalActor;
    decision: ApprovalDecision;
    comment?: string;
  },
): Promise<ApprovalOutcome> {
  const { leaveRequestId, actor, decision, comment } = params;

  // Row-level lock to prevent concurrent double-approval.
  await tx.$queryRaw`SELECT id FROM "leave_requests" WHERE id = ${leaveRequestId} FOR UPDATE`;

  const request = await tx.leaveRequest.findUnique({
    where: { id: leaveRequestId },
  });

  if (!request) {
    throw new Error("Leave request not found");
  }

  if (request.status !== LeaveRequestStatus.PENDING) {
    throw new Error(
      `Cannot act on a leave request in status "${request.status}"`,
    );
  }

  const workflow = await findActiveWorkflow(
    tx,
    request.companyId,
    request.leaveTypeId,
  );

  // --- No workflow: single-step fallback (backward compatible) ---
  if (!workflow || workflow.steps.length === 0) {
    if (decision === "APPROVE") {
      return {
        requestStatus: LeaveRequestStatus.APPROVED,
        isWorkflowDriven: false,
        currentStep: 1,
        totalSteps: 1,
        isFinalized: true,
      };
    }
    return {
      requestStatus: LeaveRequestStatus.REJECTED,
      isWorkflowDriven: false,
      currentStep: 1,
      totalSteps: 1,
      isFinalized: true,
    };
  }

  // --- Workflow-driven path ---
  const approvals = await tx.leaveApproval.findMany({
    where: { leaveRequestId },
    orderBy: { stepOrder: "asc" },
  });

  // Initialize if this is a legacy request without step records.
  if (approvals.length === 0) {
    await initializeApprovals(tx, {
      companyId: request.companyId,
      leaveTypeId: request.leaveTypeId,
      leaveRequestId,
    });
  }

  const currentApproval = approvals.find(
    (a) => a.status === ApprovalStepStatus.PENDING,
  );

  if (!currentApproval) {
    throw new Error("No pending approval step found for this request");
  }

  const workflowStep = workflow.steps.find(
    (s) => s.stepOrder === currentApproval.stepOrder,
  );

  // Role enforcement: actor must match the step's required role.
  if (workflowStep && workflowStep.roleCode !== actor.roleCode) {
    throw new Error(
      `Step ${workflowStep.stepOrder} (${workflowStep.roleCode}) is not assigned to you`,
    );
  }

  const isReject = decision === "REJECT";
  const nextStatus = isReject
    ? ApprovalStepStatus.REJECTED
    : ApprovalStepStatus.APPROVED;

  await tx.leaveApproval.update({
    where: { id: currentApproval.id },
    data: {
      status: nextStatus,
      approverId: actor.userId,
      comment: comment ?? null,
      actedAt: new Date(),
    },
  });

  if (isReject) {
    return {
      requestStatus: LeaveRequestStatus.REJECTED,
      isWorkflowDriven: true,
      currentStep: currentApproval.stepOrder,
      totalSteps: workflow.steps.length,
      isFinalized: true,
    };
  }

  const remainingPending = approvals.filter(
    (a) =>
      a.id !== currentApproval.id &&
      a.status === ApprovalStepStatus.PENDING,
  );

  const isFinalApproval = remainingPending.length === 0;

  return {
    requestStatus: isFinalApproval
      ? LeaveRequestStatus.APPROVED
      : LeaveRequestStatus.PENDING,
    isWorkflowDriven: true,
    currentStep: currentApproval.stepOrder,
    totalSteps: workflow.steps.length,
    isFinalized: isFinalApproval,
  };
}

/**
 * Determines whether a step has been completed (approved/skipped).
 */
export function isStepCompleted(status: ApprovalStepStatus): boolean {
  return (
    status === ApprovalStepStatus.APPROVED ||
    status === ApprovalStepStatus.SKIPPED
  );
}