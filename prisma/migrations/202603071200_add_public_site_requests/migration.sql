-- CreateTable
CREATE TABLE "DemoRequest" (
  "id" UUID NOT NULL,
  "fullName" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "teamSize" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "submittedIp" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "submittedIp" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialSignup" (
  "id" UUID NOT NULL,
  "businessEmail" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "teamSize" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'provisioned',
  "planCode" TEXT NOT NULL,
  "submittedIp" TEXT,
  "userAgent" TEXT,
  "organizationId" UUID,
  "userId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrialSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
  "id" UUID NOT NULL,
  "planCode" TEXT NOT NULL,
  "billingPeriod" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "workEmail" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "companySize" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'pending_payment',
  "paymentProvider" TEXT,
  "externalId" TEXT,
  "submittedIp" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoRequest_status_createdAt_idx" ON "DemoRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DemoRequest_email_idx" ON "DemoRequest"("email");

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");

-- CreateIndex
CREATE INDEX "TrialSignup_businessEmail_idx" ON "TrialSignup"("businessEmail");

-- CreateIndex
CREATE INDEX "TrialSignup_status_createdAt_idx" ON "TrialSignup"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TrialSignup_organizationId_idx" ON "TrialSignup"("organizationId");

-- CreateIndex
CREATE INDEX "TrialSignup_userId_idx" ON "TrialSignup"("userId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_planCode_createdAt_idx" ON "PurchaseRequest"("planCode", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_createdAt_idx" ON "PurchaseRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequest_workEmail_idx" ON "PurchaseRequest"("workEmail");

-- AddForeignKey
ALTER TABLE "TrialSignup"
ADD CONSTRAINT "TrialSignup_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSignup"
ADD CONSTRAINT "TrialSignup_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
