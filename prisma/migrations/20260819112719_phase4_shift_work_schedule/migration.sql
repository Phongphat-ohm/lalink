-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "work_schedules" ADD COLUMN     "shiftId" TEXT;

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_entries" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shifts_companyId_idx" ON "shifts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_companyId_name_key" ON "shifts"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shift_entries_shiftId_dayOfWeek_key" ON "shift_entries"("shiftId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "employees_shiftId_idx" ON "employees"("shiftId");

-- CreateIndex
CREATE INDEX "work_schedules_shiftId_idx" ON "work_schedules"("shiftId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_entries" ADD CONSTRAINT "shift_entries_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
