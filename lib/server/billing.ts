import type { Prisma, SubscriptionPlan } from "@prisma/client";
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

type BillingFeature =
  | "attendance"
  | "kiosk"
  | "shifts"
  | "payroll"
  | "prioritySupport";

type PlanSeed = {
  name: string;
  code: string;
  description: string;
  maxEmployees: number;
  maxDevices: number;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: Array<{ code: string; label: string }>;
};

const PLAN_SEEDS: PlanSeed[] = [
  {
    name: "Starter",
    code: "starter",
    description: "Single-kiosk attendance for small teams.",
    maxEmployees: 10,
    maxDevices: 1,
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    currency: "USD",
    features: [
      { code: "attendance", label: "Basic attendance tracking" },
      { code: "kiosk", label: "Single kiosk deployment" },
      { code: "reports", label: "Standard reports" },
    ],
  },
  {
    name: "Growth",
    code: "growth",
    description: "Recommended plan for scaling teams and multi-kiosk operations.",
    maxEmployees: 50,
    maxDevices: 3,
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    currency: "USD",
    features: [
      { code: "attendance", label: "Advanced attendance tracking" },
      { code: "kiosk", label: "Up to 3 kiosks" },
      { code: "shifts", label: "Shift support" },
      { code: "payroll", label: "Advanced reports" },
    ],
  },
  {
    name: "Pro",
    code: "pro",
    description: "Multi-branch attendance with payroll exports and premium support.",
    maxEmployees: 200,
    maxDevices: 10,
    monthlyPrice: 24900,
    yearlyPrice: 249000,
    currency: "USD",
    features: [
      { code: "attendance", label: "Multi-branch attendance" },
      { code: "kiosk", label: "Up to 10 kiosks" },
      { code: "payroll", label: "Payroll exports" },
      { code: "prioritySupport", label: "Premium support" },
    ],
  },
  {
    name: "Enterprise",
    code: "enterprise",
    description: "Custom onboarding, integrations, and SLA-backed support.",
    maxEmployees: 1000000,
    maxDevices: 10000,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    features: [
      { code: "attendance", label: "Custom attendance workflows" },
      { code: "integrations", label: "Custom integrations" },
      { code: "sla", label: "Dedicated SLA" },
      { code: "prioritySupport", label: "Dedicated support" },
    ],
  },
];

let pricingCatalogPromise: Promise<void> | null = null;

async function ensurePricingCatalog() {
  if (!pricingCatalogPromise) {
    pricingCatalogPromise = (async () => {
      for (const plan of PLAN_SEEDS) {
        await prisma.subscriptionPlan.upsert({
          where: { code: plan.code },
          update: {
            name: plan.name,
            description: plan.description,
            maxEmployees: plan.maxEmployees,
            maxDevices: plan.maxDevices,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
            currency: plan.currency,
            features: plan.features,
            isActive: true,
          },
          create: plan,
        });
      }
    })().finally(() => {
      pricingCatalogPromise = null;
    });
  }

  await pricingCatalogPromise;
}

function planHasFeature(planFeatures: Prisma.JsonValue | null, feature: BillingFeature) {
  if (!planFeatures) {
    return false;
  }

  if (Array.isArray(planFeatures)) {
    return planFeatures.some((item) => {
      if (typeof item === "string") {
        return item === feature;
      }

      if (
        item &&
        typeof item === "object" &&
        "code" in item &&
        typeof item.code === "string"
      ) {
        return item.code === feature;
      }

      return false;
    });
  }

  if (typeof planFeatures === "object") {
    return Boolean((planFeatures as Record<string, unknown>)[feature]);
  }

  return false;
}

export async function getSubscriptionPlanByCode(
  code: string,
): Promise<SubscriptionPlan> {
  await ensurePricingCatalog();

  return prisma.subscriptionPlan.findUniqueOrThrow({
    where: { code },
  });
}

export function getPlanAmountCents(
  plan: SubscriptionPlan,
  billingPeriod: "monthly" | "yearly",
) {
  return billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export async function getOrganizationSubscription(organizationId: string) {
  await ensurePricingCatalog();

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: { subscriptionPlan: true },
  });

  if (subscription) {
    return subscription;
  }

  const starterPlan = await getSubscriptionPlanByCode("starter");

  return prisma.organizationSubscription.upsert({
    where: { organizationId },
    update: {
      status: SubscriptionStatus.ACTIVE,
      subscriptionPlanId: starterPlan.id,
      billingCycle: BillingCycle.MONTHLY,
    },
    create: {
      organizationId,
      subscriptionPlanId: starterPlan.id,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
    },
    include: { subscriptionPlan: true },
  });
}

export async function enforceFeatureAccess(
  organizationId: string,
  feature: BillingFeature,
  featureName: string,
) {
  const sub = await getOrganizationSubscription(organizationId);

  if (sub.status !== SubscriptionStatus.ACTIVE) {
    throw new ApiError(402, "Organization subscription is not active.");
  }

  if (!planHasFeature(sub.subscriptionPlan.features as Prisma.JsonValue | null, feature)) {
    throw new ApiError(
      403,
      `${featureName} is not available on plan '${sub.subscriptionPlan.name}'. Please upgrade to continue.`,
    );
  }

  return sub;
}

export async function enforceEmployeeLimit(organizationId: string) {
  const sub = await enforceFeatureAccess(
    organizationId,
    "attendance",
    "Employee management",
  );

  const currentEmployees = await prisma.employee.count({
    where: { organizationId },
  });

  if (currentEmployees >= sub.subscriptionPlan.maxEmployees) {
    throw new ApiError(
      403,
      `Employee limit reached for plan '${sub.subscriptionPlan.name}'. Please upgrade to add more.`,
    );
  }
}

export async function enforceDeviceLimit(organizationId: string) {
  const sub = await enforceFeatureAccess(
    organizationId,
    "kiosk",
    "Kiosk devices",
  );

  const currentDevices = await prisma.device.count({
    where: { organizationId },
  });

  if (currentDevices >= sub.subscriptionPlan.maxDevices) {
    throw new ApiError(
      403,
      `Device limit reached for plan '${sub.subscriptionPlan.name}'. Please upgrade to add more.`,
    );
  }
}
