-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PurchaseIntentStatus" AS ENUM ('PENDING', 'CHECKOUT_CREATED', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'FLUTTERWAVE');

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT;

-- CreateIndex
CREATE INDEX "Organization_email_idx" ON "Organization"("email");

-- AlterTable
ALTER TABLE "SubscriptionPlan"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "yearlyPrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Rename column
ALTER TABLE "SubscriptionPlan" RENAME COLUMN "priceMonthly" TO "monthlyPrice";

-- Backfill annual pricing from monthly pricing
UPDATE "SubscriptionPlan"
SET "yearlyPrice" = "monthlyPrice" * 10
WHERE "yearlyPrice" = 0;

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_code_idx" ON "SubscriptionPlan"("isActive", "code");

-- Alter OrganizationSubscription foreign key before rename
ALTER TABLE "OrganizationSubscription"
DROP CONSTRAINT IF EXISTS "OrganizationSubscription_planId_fkey";

-- Rename column
ALTER TABLE "OrganizationSubscription" RENAME COLUMN "planId" TO "subscriptionPlanId";

-- Alter status to enum
ALTER TABLE "OrganizationSubscription"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "OrganizationSubscription"
ALTER COLUMN "status" TYPE "SubscriptionStatus"
USING (
  CASE
    WHEN lower("status") = 'active' THEN 'ACTIVE'::"SubscriptionStatus"
    WHEN lower("status") = 'past_due' THEN 'PAST_DUE'::"SubscriptionStatus"
    WHEN lower("status") = 'canceled' THEN 'CANCELED'::"SubscriptionStatus"
    WHEN lower("status") = 'trialing' THEN 'TRIALING'::"SubscriptionStatus"
    ELSE 'INCOMPLETE'::"SubscriptionStatus"
  END
);

ALTER TABLE "OrganizationSubscription"
ALTER COLUMN "status" SET DEFAULT 'INCOMPLETE';

-- AlterTable
ALTER TABLE "OrganizationSubscription"
ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN "provider" "PaymentProvider",
ADD COLUMN "providerCustomerId" TEXT,
ADD COLUMN "providerSubscriptionId" TEXT,
ADD COLUMN "currentPeriodStart" TIMESTAMP(3);

-- Drop deprecated external reference
ALTER TABLE "OrganizationSubscription"
DROP COLUMN IF EXISTS "externalId";

-- AddForeignKey
ALTER TABLE "OrganizationSubscription"
ADD CONSTRAINT "OrganizationSubscription_subscriptionPlanId_fkey"
FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "OrganizationSubscription_status_currentPeriodEnd_idx"
ON "OrganizationSubscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "OrganizationSubscription_provider_providerSubscriptionId_idx"
ON "OrganizationSubscription"("provider", "providerSubscriptionId");

-- Drop old purchase requests table
DROP TABLE IF EXISTS "PurchaseRequest";

-- CreateTable
CREATE TABLE "PurchaseIntent" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "subscriptionPlanId" UUID NOT NULL,
  "billingCycle" "BillingCycle" NOT NULL,
  "fullName" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "workEmail" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "companySize" TEXT NOT NULL,
  "employeeCount" INTEGER NOT NULL,
  "deviceCount" INTEGER NOT NULL,
  "status" "PurchaseIntentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentProvider" "PaymentProvider",
  "providerReference" TEXT,
  "submittedIp" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
  "id" UUID NOT NULL,
  "purchaseIntentId" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "eventType" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseIntent_organizationId_createdAt_idx" ON "PurchaseIntent"("organizationId", "createdAt");
CREATE INDEX "PurchaseIntent_subscriptionPlanId_createdAt_idx" ON "PurchaseIntent"("subscriptionPlanId", "createdAt");
CREATE INDEX "PurchaseIntent_status_createdAt_idx" ON "PurchaseIntent"("status", "createdAt");
CREATE INDEX "PurchaseIntent_workEmail_idx" ON "PurchaseIntent"("workEmail");
CREATE INDEX "PurchaseIntent_paymentProvider_providerReference_idx" ON "PurchaseIntent"("paymentProvider", "providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_providerEventId_key" ON "PaymentEvent"("provider", "providerEventId");
CREATE INDEX "PaymentEvent_purchaseIntentId_createdAt_idx" ON "PaymentEvent"("purchaseIntentId", "createdAt");

-- AddForeignKey
ALTER TABLE "PurchaseIntent"
ADD CONSTRAINT "PurchaseIntent_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseIntent"
ADD CONSTRAINT "PurchaseIntent_subscriptionPlanId_fkey"
FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent"
ADD CONSTRAINT "PaymentEvent_purchaseIntentId_fkey"
FOREIGN KEY ("purchaseIntentId") REFERENCES "PurchaseIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
