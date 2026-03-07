import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { markPurchaseIntentCanceled } from "@/lib/billing/createPurchaseIntent";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const dynamic = "force-dynamic";

type CancelPageProps = {
  searchParams: Promise<{ plan?: string; intent_id?: string }>;
};

export default async function CheckoutCancelPage({
  searchParams,
}: CancelPageProps) {
  const { plan, intent_id: intentId } = await searchParams;
  await markPurchaseIntentCanceled(intentId);

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="mx-auto max-w-3xl site-card rounded-[2rem] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-white">
            Checkout canceled
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-400">
            No payment was completed. You can return to pricing or retry
            checkout with your selected plan.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={`/purchase?plan=${plan || "growth"}`}
              className="cta-primary"
            >
              Retry Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="cta-secondary">
              Back to Pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
