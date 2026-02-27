-- Switch to employee-centric attendance for kiosk flow
DROP TABLE IF EXISTS "Attendance";

CREATE TABLE "Employee" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "department" TEXT,
  "title" TEXT,
  "bio" TEXT,
  "faceEmbedding" JSONB,
  "faceEnrolledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

CREATE TABLE "Attendance" (
  "id" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "type" "AttendanceType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "distance" DOUBLE PRECISION NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");
CREATE INDEX "Attendance_timestamp_idx" ON "Attendance"("timestamp");

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
