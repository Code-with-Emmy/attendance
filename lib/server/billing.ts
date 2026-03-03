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
  maxEmployees: number;
  maxDevices: number;
  priceMonthly: number;
  features: Record<string, boolean>;
};

const PLAN_SEEDS: PlanSeed[] = [
  {
    name: "Starter",
    code: "starter",
    maxEmployees: 10,
    maxDevices: 1,
    priceMonthly: 2900,
    features: {
      attendance: true,
      kiosk: true,
    },
  },
  {
    name: "Growth",
    code: "growth",
    maxEmployees: 50,
    maxDevices: 3,
    priceMonthly: 9900,
    features: {
      attendance: true,
      kiosk: true,
      shifts: true,
      payroll: true,
    },
  },
  {
    name: "Pro",
    code: "pro",
    maxEmployees: 200,
    maxDevices: 10,
    priceMonthly: 24900,
    features: {
      attendance: true,
      kiosk: true,
      shifts: true,
      payroll: true,
      prioritySupport: true,
    },
  },
  {
    name: "Enterprise",
    code: "enterprise",
    maxEmployees: 1000000,
    maxDevices: 10000,
    priceMonthly: 0,
    features: {
      attendance: true,
      kiosk: true,
      shifts: true,
      payroll: true,
      prioritySupport: true,
    },
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
            maxEmployees: plan.maxEmployees,
            maxDevices: plan.maxDevices,
            priceMonthly: plan.priceMonthly,
            features: plan.features,
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

function planHasFeature(planFeatures: unknown, feature: BillingFeature) {
  if (!planFeatures || typeof planFeatures !== "object" || Array.isArray(planFeatures)) {
    return false;
  }

  return Boolean((planFeatures as Record<string, unknown>)[feature]);
}

export async function getOrganizationSubscription(organizationId: string) {
  await ensurePricingCatalog();

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription) {
    return subscription;
  }

  const starterPlan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { code: "starter" },
  });

  return prisma.organizationSubscription.upsert({
    where: { organizationId },
    update: {
      status: "active",
      planId: starterPlan.id,
    },
    create: {
      organizationId,
      planId: starterPlan.id,
      status: "active",
    },
    include: { plan: true },
  });
}

export async function enforceFeatureAccess(
  organizationId: string,
  feature: BillingFeature,
  featureName: string,
) {
  const sub = await getOrganizationSubscription(organizationId);

  if (sub.status !== "active") {
    throw new ApiError(402, "Organization subscription is not active.");
  }

  if (!planHasFeature(sub.plan.features, feature)) {
    throw new ApiError(
      403,
      `${featureName} is not available on plan '${sub.plan.name}'. Please upgrade to continue.`,
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

  if (currentEmployees >= sub.plan.maxEmployees) {
    throw new ApiError(
      403,
      `Employee limit reached for plan '${sub.plan.name}'. Please upgrade to add more.`,
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

  if (currentDevices >= sub.plan.maxDevices) {
    throw new ApiError(
      403,
      `Device limit reached for plan '${sub.plan.name}'. Please upgrade to add more.`,
    );
  }
}
