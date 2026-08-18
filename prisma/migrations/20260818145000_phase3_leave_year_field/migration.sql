-- AlterTable: add year key to LeaveYear
ALTER TABLE "leave_years" ADD COLUMN "year" INTEGER;

-- Backfill existing rows with the end-date year (safe; table is small)
UPDATE "leave_years" SET "year" = EXTRACT(YEAR FROM "endDate")::INTEGER WHERE "year" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "leave_years" ALTER COLUMN "year" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "leave_years_companyId_year_key" ON "leave_years"("companyId", "year");
