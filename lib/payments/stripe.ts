import Stripe from "stripe";
import { BillingCycle, PaymentProvider, SubscriptionStatus } from "@prisma/client";
import { ApiError } from "@/lib/server/errors";
import { getBillingAmount } from "@/lib/billing/getPlanByCode";
import type { CheckoutSessionInput, CheckoutSessionResult } from "@/lib/payments/types";

import { getPlatformSecret } from "@/lib/server/secrets";

let stripeClient: Stripe | null = null;

async function requireStripeSecretKey() {
  const secretKey = await getPlatformSecret("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new ApiError(500, "Missing STRIPE_SECRET_KEY in database or environment.");
  }

  return secretKey;
}

export async function getStripeClient() {
  // We recreate/revalidate if needed, or just return existing
  // For simplicity, let's keep it singleton but verify we have one
  if (stripeClient) {
    return stripeClient;
  }

  const key = await requireStripeSecretKey();
  stripeClient = new Stripe(key, {
    apiVersion: "2026-02-25.clover",
  });

  return stripeClient;
}

export async function createStripeCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = await getStripeClient();
  const amount = getBillingAmount(input.purchaseIntent.subscriptionPlan, input.billingCycle);
  const interval =
    input.billingCycle === BillingCycle.YEARLY ? "year" : "month";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: input.purchaseIntent.id,
    customer_email:
      input.purchaseIntent.organization.email || input.purchaseIntent.workEmail,
    metadata: {
      purchaseIntentId: input.purchaseIntent.id,
      organizationId: input.purchaseIntent.organizationId,
      organizationName: input.purchaseIntent.organization.name,
      planCode: input.purchaseIntent.subscriptionPlan.code,
      billingCycle: input.billingCycle,
    },
    subscription_data: {
      metadata: {
        purchaseIntentId: input.purchaseIntent.id,
        organizationId: input.purchaseIntent.organizationId,
        organizationName: input.purchaseIntent.organization.name,
        planCode: input.purchaseIntent.subscriptionPlan.code,
        billingCycle: input.billingCycle,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.purchaseIntent.subscriptionPlan.currency.toLowerCase(),
          unit_amount: amount,
          recurring: {
            interval,
          },
          product_data: {
            name: `${input.purchaseIntent.subscriptionPlan.name} Plan`,
            description: input.purchaseIntent.subscriptionPlan.description,
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new ApiError(500, "Stripe did not return a checkout URL.");
  }

  return {
    provider: PaymentProvider.STRIPE,
    providerReference: session.id,
    checkoutUrl: session.url,
  };
}

export async function verifyStripeWebhookSignature(payload: string, signature: string) {
  const secret = await getPlatformSecret("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    throw new ApiError(500, "Missing STRIPE_WEBHOOK_SECRET in database or environment.");
  }

  const stripe = await getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = await getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  const stripe = await getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return SubscriptionStatus.INCOMPLETE;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}
