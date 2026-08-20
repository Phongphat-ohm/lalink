-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('GENERAL', 'UPGRADE_REQUEST', 'BILLING', 'SUPPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'RESOLVED');

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "MessageCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',
    "companyId" TEXT,
    "planUpgradeRequestId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_threads_companyId_idx" ON "message_threads"("companyId");

-- CreateIndex
CREATE INDEX "message_threads_category_idx" ON "message_threads"("category");

-- CreateIndex
CREATE INDEX "message_threads_status_idx" ON "message_threads"("status");

-- CreateIndex
CREATE INDEX "message_threads_lastMessageAt_idx" ON "message_threads"("lastMessageAt");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "messages"("isRead");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_planUpgradeRequestId_fkey" FOREIGN KEY ("planUpgradeRequestId") REFERENCES "plan_upgrade_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
