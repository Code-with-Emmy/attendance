-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Create default organization
INSERT INTO "Organization" ("id", "name", "slug", "updatedAt")
VALUES ('00000000-0000-4000-a000-000000000000', 'Default Organization', 'default', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "organizationId" UUID;
UPDATE "User" SET "organizationId" = '00000000-0000-4000-a000-000000000000';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "organizationId" UUID;
UPDATE "Employee" SET "organizationId" = '00000000-0000-4000-a000-000000000000';
ALTER TABLE "Employee" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "organizationId" UUID;
UPDATE "Attendance" SET "organizationId" = '00000000-0000-4000-a000-000000000000';
ALTER TABLE "Attendance" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Attendance_organizationId_idx" ON "Attendance"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
