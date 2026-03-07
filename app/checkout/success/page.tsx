import Link from "next/link";
import { PaymentProvider, PurchaseIntentStatus } from "@prisma/client";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { activateSubscription } from "@/lib/billing/activateSubscription";
import { formatMoney } from "@/lib/billing/getPlanByCode";
import { prisma } from "@/lib/prisma";
import {
  mapStripeSubscriptionStatus,
  retrieveStripeCheckoutSession,
  retrieveStripeSubscription,
} from "@/lib/payments/stripe";
import type Stripe from "stripe";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <PublicSiteShell>
        <section className="site-container py-18">
          <div className="site-card rounded-4xl p-8">
            <h1 className="text-3xl font-semibold text-white">
              We could not confirm this checkout yet.
            </h1>
            <p className="mt-4 text-slate-400">
              The checkout session identifier was not provided.
            </p>
          </div>
        </section>
      </PublicSiteShell>
    );
  }

  let purchaseIntent = await prisma.purchaseIntent.findFirst({
    where: {
      providerReference: sessionId,
    },
    include: {
      organization: true,
      subscriptionPlan: true,
    },
  });

  if (
    purchaseIntent &&
    purchaseIntent.status !== PurchaseIntentStatus.PAID &&
    purchaseIntent.paymentProvider === PaymentProvider.STRIPE
  ) {
    const session = await retrieveStripeCheckoutSession(sessionId);
    if (
      session.payment_status === "paid" &&
      session.subscription &&
      typeof session.subscription === "string"
    ) {
      const subscription = (await retrieveStripeSubscription(
        session.subscription,
      )) as unknown as Stripe.Subscription;
      const activated = await activateSubscription({
        purchaseIntentId: purchaseIntent.id,
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

      purchaseIntent = activated.purchaseIntent;
    }
  }

  if (!purchaseIntent) {
    return (
      <PublicSiteShell>
        <section className="site-container py-18">
          <div className="site-card rounded-4xl p-8">
            <h1 className="text-3xl font-semibold text-white">
              Purchase confirmation pending
            </h1>
            <p className="mt-4 text-slate-400">
              We have not matched this checkout to a purchase intent yet. Please
              wait a moment and refresh this page.
            </p>
          </div>
        </section>
      </PublicSiteShell>
    );
  }

  const subscription = await prisma.organizationSubscription.findUnique({
    where: { organizationId: purchaseIntent.organizationId },
    include: {
      subscriptionPlan: true,
    },
  });

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="site-card rounded-4xl p-8">
            <div className="flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
              <span className="section-label">Payment Successful</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-white">
              Subscription confirmed for {purchaseIntent.organization.name}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-400">
              Your checkout completed successfully and the organization
              subscription is now recorded in Postgres.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Selected plan</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {purchaseIntent.subscriptionPlan.name}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Billing cycle</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {purchaseIntent.billingCycle.toLowerCase()}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Subscription status</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {subscription?.status.toLowerCase() || "pending"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Organization email</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {purchaseIntent.organization.email ||
                    purchaseIntent.workEmail}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/login" className="cta-primary">
                Go to Admin Login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="cta-secondary">
                Continue Setup
              </Link>
            </div>
          </div>

          <aside className="site-card rounded-4xl p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Next steps</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Confirm admin credentials, register kiosks, and enroll your
                  first employees. Your billing data is now attached to the
                  organization record.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/8 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Current charge</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatMoney(
                  purchaseIntent.billingCycle === "YEARLY"
                    ? purchaseIntent.subscriptionPlan.yearlyPrice
                    : purchaseIntent.subscriptionPlan.monthlyPrice,
                  purchaseIntent.subscriptionPlan.currency,
                )}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </PublicSiteShell>
  );
}
