import {
  PaymentProvider,
  PurchaseIntentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import {
  activateSubscription,
  recordPaymentEvent,
} from "@/lib/billing/activateSubscription";
import { prisma } from "@/lib/prisma";
import {
  verifyFlutterwaveTransaction,
  verifyFlutterwaveWebhook,
} from "@/lib/payments/flutterwave";
import { ApiError, toErrorResponse } from "@/lib/server/errors";

type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
  };
};

export async function POST(request: Request) {
  try {
    verifyFlutterwaveWebhook(request);
    const payload = (await request.json()) as FlutterwaveWebhookPayload;
    const txRef = payload.data?.tx_ref;

    if (!txRef) {
      throw new ApiError(400, "Missing Flutterwave transaction reference.");
    }

    const purchaseIntent = await prisma.purchaseIntent.findFirst({
      where: {
        providerReference: txRef,
      },
      include: {
        organization: true,
        subscriptionPlan: true,
      },
    });

    if (!purchaseIntent) {
      throw new ApiError(404, "Purchase intent not found.");
    }

    const verified =
      payload.data?.id !== undefined
        ? ((await verifyFlutterwaveTransaction(String(payload.data.id))) as {
            data?: {
              id?: number;
              tx_ref?: string;
              status?: string;
            };
          })
        : null;

    const transactionStatus =
      verified?.data?.status || payload.data?.status || "failed";

    if (transactionStatus === "successful") {
      const activated = await activateSubscription({
        purchaseIntentId: purchaseIntent.id,
        provider: PaymentProvider.FLUTTERWAVE,
        providerReference: txRef,
        status: SubscriptionStatus.ACTIVE,
      });

      await recordPaymentEvent({
        purchaseIntentId: activated.purchaseIntent.id,
        provider: PaymentProvider.FLUTTERWAVE,
        eventType: payload.event || "payment.success",
        providerEventId: String(verified?.data?.id || payload.data?.id || txRef),
        payload: payload as unknown as Record<string, unknown>,
      });
    } else {
      await prisma.purchaseIntent.update({
        where: { id: purchaseIntent.id },
        data: {
          status: PurchaseIntentStatus.FAILED,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to process Flutterwave webhook.");
  }
}
