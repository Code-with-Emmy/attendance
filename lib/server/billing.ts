import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export async function getOrganizationSubscription(organizationId: string) {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (subscription) {
    return subscription;
  }

  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { code: "free" },
    update: {},
    create: {
      name: "Free",
      code: "free",
      maxEmployees: 10,
      maxDevices: 1,
      priceMonthly: 0,
      features: {
        attendance: true,
        kiosk: true,
        adminDashboard: true,
      },
    },
  });

  return prisma.organizationSubscription.upsert({
    where: { organizationId },
    update: {
      status: "active",
      planId: freePlan.id,
    },
    create: {
      organizationId,
      planId: freePlan.id,
      status: "active",
    },
    include: { plan: true },
  });
}

export async function enforceEmployeeLimit(organizationId: string) {
  const sub = await getOrganizationSubscription(organizationId);
  if (sub.status !== "active") {
    throw new ApiError(402, "Organization subscription is not active.");
  }

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
  const sub = await getOrganizationSubscription(organizationId);
  if (sub.status !== "active") {
    throw new ApiError(402, "Organization subscription is not active.");
  }

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
