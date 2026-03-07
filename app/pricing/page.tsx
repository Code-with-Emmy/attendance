import { Metadata } from "next";
import { listActivePlans } from "@/lib/billing/getPlanByCode";
import { PricingCards } from "@/components/PricingCards";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const metadata: Metadata = {
  title: "Pricing",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await listActivePlans();

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="max-w-3xl">
          <p className="section-label">Pricing</p>
          <h1 className="mt-4 section-heading text-white">
            Flexible pricing for attendance deployments from one kiosk to many.
          </h1>
          <p className="section-copy mt-5">
            Choose a self-serve plan for straightforward deployments or talk to
            us about enterprise rollout support, integrations, and SLAs.
          </p>
        </div>
      </section>

      <PricingCards plans={plans} />
    </PublicSiteShell>
  );
}
