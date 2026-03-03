import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export async function getOrganizationSubscription(organizationId: string) {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (!subscription) {
    // Fallback to a default 'free' plan if not found, or throw
    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { code: "free" },
    });
    
    if (!freePlan) {
      throw new ApiError(500, "Billing system not fully initialized.");
    }
    
    return {
      status: "active",
      plan: freePlan,
    };
  }

  return subscription;
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
