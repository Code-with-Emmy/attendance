import { PaymentProvider, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  activateSubscription,
  recordPaymentEvent,
  syncSubscriptionStatusByProviderSubscription,
} from "@/lib/billing/activateSubscription";
import {
  mapStripeSubscriptionStatus,
  retrieveStripeSubscription,
  verifyStripeWebhookSignature,
} from "@/lib/payments/stripe";
import { ApiError, toErrorResponse } from "@/lib/server/errors";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw new ApiError(400, "Missing Stripe signature.");
    }

    const payload = await request.text();
    const event = await verifyStripeWebhookSignature(payload, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseIntentId = session.metadata?.purchaseIntentId;
        if (!purchaseIntentId) {
          break;
        }

        await recordPaymentEvent({
          purchaseIntentId,
          provider: PaymentProvider.STRIPE,
          eventType: event.type,
          providerEventId: event.id,
          payload: event as unknown as Record<string, unknown>,
        });

        if (session.subscription && typeof session.subscription === "string") {
          const subscription = (await retrieveStripeSubscription(
            session.subscription,
          )) as unknown as Stripe.Subscription;
          await activateSubscription({
            purchaseIntentId,
            provider: PaymentProvider.STRIPE,
            providerReference: session.id,
            providerCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
            providerSubscriptionId: subscription.id,
            status: mapStripeSubscriptionStatus(subscription.status),
            currentPeriodStart: new Date(
              subscription.items.data[0].current_period_start * 1000,
            ),
            currentPeriodEnd: new Date(
              subscription.items.data[0].current_period_end * 1000,
            ),
          });
        }
        break;
      }

      case "invoice.paid":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = (event.type === "invoice.paid"
            ? await retrieveStripeSubscription(
                ((event.data.object as any).subscription_details?.subscription ||
                  (event.data.object as any).subscription) as string,
              )
            : event.data.object) as unknown as Stripe.Subscription;

        const synced = await syncSubscriptionStatusByProviderSubscription({
          provider: PaymentProvider.STRIPE,
          providerSubscriptionId: subscription.id,
          status:
            event.type === "customer.subscription.deleted"
              ? SubscriptionStatus.CANCELED
              : mapStripeSubscriptionStatus(subscription.status),
          providerCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id,
          currentPeriodStart: new Date(
            subscription.items.data[0].current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            subscription.items.data[0].current_period_end * 1000,
          ),
        });

        if (synced.purchaseIntent) {
          await recordPaymentEvent({
            purchaseIntentId: synced.purchaseIntent.id,
            provider: PaymentProvider.STRIPE,
            eventType: event.type,
            providerEventId: event.id,
            payload: event as unknown as Record<string, unknown>,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to process Stripe webhook.");
  }
}
