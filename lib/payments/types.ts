import type {
  BillingCycle,
  PaymentProvider,
  PurchaseIntent,
  SubscriptionPlan,
} from "@prisma/client";

export type CheckoutSessionInput = {
  purchaseIntent: PurchaseIntent & {
    organization: {
      id: string;
      name: string;
      slug: string;
      email: string | null;
      phone: string | null;
    };
    subscriptionPlan: SubscriptionPlan;
  };
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult = {
  provider: PaymentProvider;
  providerReference: string;
  checkoutUrl: string;
};

export function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  return appUrl.replace(/\/$/, "");
}

export function getDefaultPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toUpperCase();

  if (provider === "FLUTTERWAVE") {
    return "FLUTTERWAVE";
  }

  return "STRIPE";
}
