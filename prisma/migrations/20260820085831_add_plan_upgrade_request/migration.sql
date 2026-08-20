-- CreateEnum
CREATE TYPE "PlanUpgradeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "plan_upgrade_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "currentPlanId" TEXT,
    "targetPlanId" TEXT NOT NULL,
    "requestedSeats" INTEGER,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "notes" TEXT,
    "status" "PlanUpgradeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_upgrade_requests_companyId_idx" ON "plan_upgrade_requests"("companyId");

-- CreateIndex
CREATE INDEX "plan_upgrade_requests_status_idx" ON "plan_upgrade_requests"("status");

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_currentPlanId_fkey" FOREIGN KEY ("currentPlanId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_targetPlanId_fkey" FOREIGN KEY ("targetPlanId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_upgrade_requests" ADD CONSTRAINT "plan_upgrade_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
