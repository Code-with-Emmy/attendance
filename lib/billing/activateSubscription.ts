import {
  BillingCycle,
  PaymentProvider,
  PurchaseIntentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPurchaseConfirmationEmail } from "@/lib/email/sendPurchaseEmails";
import { ApiError } from "@/lib/server/errors";

type ActivateSubscriptionInput = {
  purchaseIntentId: string;
  provider: PaymentProvider;
  providerReference: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

type RecordPaymentEventInput = {
  purchaseIntentId: string;
  provider: PaymentProvider;
  eventType: string;
  providerEventId: string;
  payload: unknown;
};

export async function recordPaymentEvent(input: RecordPaymentEventInput) {
  return prisma.paymentEvent.upsert({
    where: {
      provider_providerEventId: {
        provider: input.provider,
        providerEventId: input.providerEventId,
      },
    },
    update: {
      payload: input.payload as never,
    },
    create: {
      purchaseIntentId: input.purchaseIntentId,
      provider: input.provider,
      eventType: input.eventType,
      providerEventId: input.providerEventId,
      payload: input.payload as never,
    },
  });
}

export async function activateSubscription(input: ActivateSubscriptionInput) {
  const purchaseIntent = await prisma.purchaseIntent.findUnique({
    where: { id: input.purchaseIntentId },
    include: {
      organization: true,
      subscriptionPlan: true,
    },
  });

  if (!purchaseIntent) {
    throw new ApiError(404, "Purchase intent not found.");
  }

  const status = input.status ?? SubscriptionStatus.ACTIVE;
  const billingCycle = input.billingCycle ?? purchaseIntent.billingCycle;
  const shouldSendConfirmation =
    purchaseIntent.status !== PurchaseIntentStatus.PAID;

  const result = await prisma.$transaction(async (tx) => {
    const updatedIntent = await tx.purchaseIntent.update({
      where: { id: purchaseIntent.id },
      data: {
        status: PurchaseIntentStatus.PAID,
        paymentProvider: input.provider,
        providerReference: input.providerReference,
      },
      include: {
        organization: true,
        subscriptionPlan: true,
      },
    });

    const subscription = await tx.organizationSubscription.upsert({
      where: {
        organizationId: purchaseIntent.organizationId,
      },
      update: {
        subscriptionPlanId: purchaseIntent.subscriptionPlanId,
        status,
        billingCycle,
        provider: input.provider,
        providerCustomerId: input.providerCustomerId ?? undefined,
        providerSubscriptionId: input.providerSubscriptionId ?? undefined,
        currentPeriodStart: input.currentPeriodStart ?? undefined,
        currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      },
      create: {
        organizationId: purchaseIntent.organizationId,
        subscriptionPlanId: purchaseIntent.subscriptionPlanId,
        status,
        billingCycle,
        provider: input.provider,
        providerCustomerId: input.providerCustomerId ?? undefined,
        providerSubscriptionId: input.providerSubscriptionId ?? undefined,
        currentPeriodStart: input.currentPeriodStart ?? undefined,
        currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      },
      include: {
        organization: true,
        subscriptionPlan: true,
      },
    });

    return {
      purchaseIntent: updatedIntent,
      subscription,
    };
  });

  if (shouldSendConfirmation) {
    const recipientEmail =
      result.purchaseIntent.organization.email || result.purchaseIntent.workEmail;

    try {
      await sendPurchaseConfirmationEmail({
        purchaseIntentId: result.purchaseIntent.id,
        recipientEmail,
        organizationName: result.purchaseIntent.organization.name,
        planName: result.purchaseIntent.subscriptionPlan.name,
        billingCycle,
        subscriptionStartDate:
          result.subscription.currentPeriodStart || new Date(),
      });
    } catch (error) {
      console.error("Failed to send purchase confirmation email", error);
    }
  }

  return result;
}

export async function syncSubscriptionStatusByProviderSubscription(input: {
  provider: PaymentProvider;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  providerCustomerId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  const subscription = await prisma.organizationSubscription.findFirst({
    where: {
      provider: input.provider,
      providerSubscriptionId: input.providerSubscriptionId,
    },
    include: {
      subscriptionPlan: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found for provider event.");
  }

  const updatedSubscription = await prisma.organizationSubscription.update({
    where: { id: subscription.id },
    data: {
      status: input.status,
      providerCustomerId: input.providerCustomerId ?? undefined,
      currentPeriodStart: input.currentPeriodStart ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
    },
    include: {
      subscriptionPlan: true,
      organization: true,
    },
  });

  const purchaseIntent = await prisma.purchaseIntent.findFirst({
    where: {
      organizationId: updatedSubscription.organizationId,
      subscriptionPlanId: updatedSubscription.subscriptionPlanId,
      paymentProvider: input.provider,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    subscription: updatedSubscription,
    purchaseIntent,
  };
}
