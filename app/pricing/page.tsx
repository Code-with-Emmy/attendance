import Image from "next/image";
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
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
          <div className="max-w-3xl">
            <p className="section-label">Pricing</p>
            <h1 className="mt-4 section-heading text-[#021141]">
              Flexible pricing for attendance deployments from one kiosk to many.
            </h1>
            <p className="section-copy mt-5">
              Choose a self-serve plan for straightforward deployments or talk to
              us about enterprise rollout support, integrations, and SLAs.
            </p>
          </div>

          <div className="site-card rounded-[1.8rem] p-4">
            <Image
              src="/illustrations/kiosk-promo-pricing-demo.svg"
              alt="AttendanceKiosk promo illustration showing kiosk verification and live product status"
              width={1400}
              height={1000}
              priority
              className="h-auto w-full rounded-[1.2rem] border border-[#d8c6a8]/10 bg-[#041236]/50"
            />
          </div>
        </div>
      </section>

      <PricingCards plans={plans} />
    </PublicSiteShell>
  );
}
