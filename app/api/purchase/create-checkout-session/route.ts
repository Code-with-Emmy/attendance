import {
  PaymentProvider,
  PurchaseIntentStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFlutterwaveCheckoutSession } from "@/lib/payments/flutterwave";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import {
  getAppUrl,
  getDefaultPaymentProvider,
} from "@/lib/payments/types";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { createCheckoutSessionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });
    const parsed = createCheckoutSessionSchema.parse(body);

    const purchaseIntent = await prisma.purchaseIntent.findUnique({
      where: { id: parsed.purchaseIntentId },
      include: {
        organization: true,
        subscriptionPlan: true,
      },
    });

    if (!purchaseIntent) {
      throw new ApiError(404, "Purchase intent not found.");
    }

    if (purchaseIntent.status === PurchaseIntentStatus.PAID) {
      throw new ApiError(400, "This purchase intent has already been paid.");
    }

    const provider = (parsed.provider as PaymentProvider | undefined) ??
      getDefaultPaymentProvider();
    const appUrl = getAppUrl();
    const successUrl = `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/checkout/cancel?plan=${purchaseIntent.subscriptionPlan.code}&intent_id=${purchaseIntent.id}`;

    const checkoutSession =
      provider === PaymentProvider.FLUTTERWAVE
        ? await createFlutterwaveCheckoutSession({
            purchaseIntent,
            billingCycle: purchaseIntent.billingCycle,
            successUrl,
            cancelUrl,
          })
        : await createStripeCheckoutSession({
            purchaseIntent,
            billingCycle: purchaseIntent.billingCycle,
            successUrl,
            cancelUrl,
          });

    await prisma.purchaseIntent.update({
      where: { id: purchaseIntent.id },
      data: {
        status: PurchaseIntentStatus.CHECKOUT_CREATED,
        paymentProvider: checkoutSession.provider,
        providerReference: checkoutSession.providerReference,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkoutUrl,
      provider: checkoutSession.provider,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create checkout session.");
  }
}
