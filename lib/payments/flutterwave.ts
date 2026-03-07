import { PaymentProvider } from "@prisma/client";
import { ApiError } from "@/lib/server/errors";
import { getBillingAmount } from "@/lib/billing/getPlanByCode";
import type { CheckoutSessionInput, CheckoutSessionResult } from "@/lib/payments/types";

function getFlutterwaveSecretKey() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    throw new ApiError(500, "Missing FLUTTERWAVE_SECRET_KEY.");
  }

  return secretKey;
}

export async function createFlutterwaveCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const txRef = `atk_${input.purchaseIntent.id}`;
  const amount = getBillingAmount(input.purchaseIntent.subscriptionPlan, input.billingCycle) / 100;
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getFlutterwaveSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: input.purchaseIntent.subscriptionPlan.currency,
      redirect_url: input.successUrl.replace(
        "session_id={CHECKOUT_SESSION_ID}",
        `provider=flutterwave&tx_ref=${txRef}`,
      ),
      customer: {
        email:
          input.purchaseIntent.organization.email || input.purchaseIntent.workEmail,
        name: input.purchaseIntent.fullName,
        phonenumber: input.purchaseIntent.phone,
      },
      customizations: {
        title: "AttendanceKiosk Subscription",
        description: `${input.purchaseIntent.subscriptionPlan.name} ${input.billingCycle.toLowerCase()} subscription`,
      },
      meta: {
        purchaseIntentId: input.purchaseIntent.id,
        organizationId: input.purchaseIntent.organizationId,
        planCode: input.purchaseIntent.subscriptionPlan.code,
        billingCycle: input.billingCycle,
      },
    }),
  });

  if (!response.ok) {
    throw new ApiError(502, "Flutterwave checkout session creation failed.");
  }

  const payload = (await response.json()) as {
    data?: {
      link?: string;
    };
  };

  if (!payload.data?.link) {
    throw new ApiError(500, "Flutterwave did not return a payment link.");
  }

  return {
    provider: PaymentProvider.FLUTTERWAVE,
    providerReference: txRef,
    checkoutUrl: payload.data.link,
  };
}

export function verifyFlutterwaveWebhook(req: Request) {
  const configuredHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

  if (!configuredHash) {
    throw new ApiError(500, "Missing FLUTTERWAVE_WEBHOOK_HASH.");
  }

  const incomingHash = req.headers.get("verif-hash");
  if (!incomingHash || incomingHash !== configuredHash) {
    throw new ApiError(401, "Invalid Flutterwave webhook signature.");
  }
}

export async function verifyFlutterwaveTransaction(transactionId: string) {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${getFlutterwaveSecretKey()}`,
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(502, "Flutterwave transaction verification failed.");
  }

  return response.json();
}
