import { Metadata } from "next";
import { getPlanByCode, listActivePlans } from "@/lib/billing/getPlanByCode";
import { PurchaseForm } from "@/components/PurchaseForm";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const metadata: Metadata = {
  title: "Purchase",
};

export const dynamic = "force-dynamic";

type PurchasePageProps = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function PurchasePage({
  searchParams,
}: PurchasePageProps) {
  const { plan } = await searchParams;
  const [selectedPlan, plans] = await Promise.all([
    getPlanByCode(plan),
    listActivePlans(),
  ]);

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="max-w-3xl">
          <p className="section-label">Purchase</p>
          <h1 className="mt-4 section-heading text-white">
            Subscribe to AttendanceKiosk and launch a secure attendance rollout.
          </h1>
          <p className="section-copy mt-5">
            Your selected plan is preloaded from the URL so this page supports
            direct handoff from pricing and marketing CTAs.
          </p>
        </div>

        <div className="mt-10">
          <PurchaseForm initialPlan={selectedPlan} plans={plans} />
        </div>
      </section>
    </PublicSiteShell>
  );
}
