-- DropForeignKey
ALTER TABLE "leave_approvals" DROP CONSTRAINT "leave_approvals_approverId_fkey";

-- AlterTable
ALTER TABLE "leave_approvals" ADD COLUMN     "roleCode" TEXT,
ALTER COLUMN "approverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "leave_approvals" ADD CONSTRAINT "leave_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
