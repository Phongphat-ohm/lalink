-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'CSV',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errors" JSONB,
    "importedBy" TEXT,
    "importedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_logs_companyId_idx" ON "import_logs"("companyId");

-- CreateIndex
CREATE INDEX "import_logs_createdAt_idx" ON "import_logs"("createdAt");

-- CreateIndex
CREATE INDEX "import_logs_status_idx" ON "import_logs"("status");

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
