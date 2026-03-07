import { BillingCycle, PurchaseIntentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireActivePlanByCode } from "@/lib/billing/getPlanByCode";
import { ApiError } from "@/lib/server/errors";
import { generateUniqueOrganizationSlug } from "@/lib/server/public-site";

type CreatePurchaseIntentInput = {
  businessName: string;
  fullName: string;
  workEmail: string;
  phone: string;
  companySize: string;
  employeeCount: number;
  deviceCount: number;
  billingCycle: BillingCycle;
  planCode: string;
  submittedIp?: string;
  userAgent?: string | null;
};

type OrganizationLookupClient = Pick<typeof prisma, "organization">;

async function findExistingOrganization(
  tx: OrganizationLookupClient,
  businessName: string,
  workEmail: string,
) {
  return tx.organization.findFirst({
    where: {
      OR: [
        { email: workEmail },
        { name: businessName },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createPurchaseIntent(input: CreatePurchaseIntentInput) {
  const plan = await requireActivePlanByCode(input.planCode);

  if (plan.code === "enterprise") {
    throw new ApiError(
      400,
      "Enterprise purchases must go through a guided sales process.",
    );
  }

  if (input.employeeCount < 1 || input.deviceCount < 1) {
    throw new ApiError(400, "Employee and device counts must be at least 1.");
  }

  const organization = await prisma.$transaction(async (tx) => {
    const existing = await findExistingOrganization(
      tx,
      input.businessName,
      input.workEmail,
    );

    if (existing) {
      return tx.organization.update({
        where: { id: existing.id },
        data: {
          name: input.businessName,
          email: input.workEmail,
          phone: input.phone,
        },
      });
    }

    const slug = await generateUniqueOrganizationSlug(input.businessName);

    return tx.organization.create({
      data: {
        name: input.businessName,
        slug,
        email: input.workEmail,
        phone: input.phone,
      },
    });
  });

  const intent = await prisma.purchaseIntent.create({
    data: {
      organizationId: organization.id,
      subscriptionPlanId: plan.id,
      billingCycle: input.billingCycle,
      fullName: input.fullName,
      businessName: input.businessName,
      workEmail: input.workEmail,
      phone: input.phone,
      companySize: input.companySize,
      employeeCount: input.employeeCount,
      deviceCount: input.deviceCount,
      status: PurchaseIntentStatus.PENDING,
      submittedIp: input.submittedIp,
      userAgent: input.userAgent ?? undefined,
    },
    include: {
      organization: true,
      subscriptionPlan: true,
    },
  });

  return intent;
}

export async function markPurchaseIntentCanceled(
  purchaseIntentId: string | null | undefined,
) {
  if (!purchaseIntentId) {
    return null;
  }

  return prisma.purchaseIntent.updateMany({
    where: {
      id: purchaseIntentId,
      status: {
        in: [PurchaseIntentStatus.PENDING, PurchaseIntentStatus.CHECKOUT_CREATED],
      },
    },
    data: {
      status: PurchaseIntentStatus.CANCELED,
    },
  });
}
