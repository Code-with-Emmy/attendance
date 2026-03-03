-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CLOCKED_IN', 'CLOCKED_OUT', 'ON_BREAK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceType" ADD VALUE 'BREAK_START';
ALTER TYPE "AttendanceType" ADD VALUE 'BREAK_END';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "sessionId" UUID;

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workDate" DATE NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceViolation" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceSession_employeeId_idx" ON "AttendanceSession"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceSession_organizationId_idx" ON "AttendanceSession"("organizationId");

-- CreateIndex
CREATE INDEX "AttendanceSession_workDate_idx" ON "AttendanceSession"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_employeeId_workDate_key" ON "AttendanceSession"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "AttendanceViolation_employeeId_idx" ON "AttendanceViolation"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceViolation_organizationId_idx" ON "AttendanceViolation"("organizationId");

-- CreateIndex
CREATE INDEX "AttendanceViolation_timestamp_idx" ON "AttendanceViolation"("timestamp");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_idx" ON "Attendance"("sessionId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceViolation" ADD CONSTRAINT "AttendanceViolation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceViolation" ADD CONSTRAINT "AttendanceViolation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
