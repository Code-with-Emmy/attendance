import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { CTASection } from "@/components/CTASection";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PricingCards } from "@/components/PricingCards";
import { ProductScreenshots } from "@/components/ProductScreenshots";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { ClientSplash } from "@/components/ClientSplash";
import { problemPoints } from "@/lib/site-content";
import { listActivePlans } from "@/lib/billing/getPlanByCode";

export const metadata: Metadata = {
  title: "Face-Verified Attendance",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plans = await listActivePlans();

  return (
    <ClientSplash>
      <PublicSiteShell>
        <Hero />

        <section className="site-container py-18">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="section-label">The Problem</p>
              <h2 className="mt-4 section-heading text-white">
                Attendance breaks down when trust, visibility, and reporting are
                separated.
              </h2>
              <p className="section-copy mt-5">
                Most teams are still trying to control time theft, manual
                timesheets, and payroll errors with systems that were never
                built for biometric verification or multi-location oversight.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {problemPoints.map((item) => (
                <article
                  key={item.title}
                  className="site-card rounded-[1.7rem] p-6"
                >
                  <p className="text-lg font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FeatureGrid />
        <HowItWorks />
        <ProductScreenshots />

        <section className="site-container py-18">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="site-card rounded-4xl p-8 sm:p-10">
              <p className="section-label">Security Preview</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                Designed to earn trust from HR, operations, and security teams.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
                From liveness checks to audit visibility and role-based access,
                the product is positioned for organizations that need more than
                a simple clock-in app.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-5">
                  <div className="flex items-center gap-3 text-emerald-300">
                    <BadgeCheck className="h-5 w-5" />
                    <span className="font-semibold text-white">
                      Liveness verification
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Reject spoofed attendance attempts before records are
                    written.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-5">
                  <div className="flex items-center gap-3 text-blue-200">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-semibold text-white">
                      Device and access controls
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    Keep kiosks device-bound and restrict sensitive workflows by
                    role.
                  </p>
                </div>
              </div>

              <Link href="/security" className="cta-secondary mt-8">
                View Security Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="site-card rounded-4xl p-8 sm:p-10">
              <p className="section-label">Pricing Preview</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                Launch fast with self-serve plans or move into a guided rollout.
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  "Starter for single-kiosk deployments",
                  "Growth for multiple kiosks and shift support",
                  "Pro for payroll exports and multi-branch teams",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-300" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="cta-primary mt-8">
                View Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="site-container pb-8">
          <PricingCards plans={plans} variant="preview" />
        </section>

        <CTASection
          title="Ready to eliminate manual attendance and time theft?"
          description="See how AttendanceKiosk fits your operating model, rollout timeline, and security requirements before you deploy to your first device."
        />
      </PublicSiteShell>
    </ClientSplash>
  );
}
