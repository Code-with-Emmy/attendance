import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { TrialForm } from "@/components/TrialForm";

export const metadata: Metadata = {
  title: "Start Free Trial",
};

const onboardingSteps = [
  "Create organization",
  "Add employees",
  "Register kiosk",
  "Start clocking in",
];

export default function TrialPage() {
  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <TrialForm />

          <aside className="site-card rounded-[2rem] p-7">
            <p className="section-label">Onboarding Preview</p>
            <h2 className="mt-4 text-3xl font-black text-white">
              What happens after signup
            </h2>
            <p className="mt-4 text-base leading-8 text-[#d7c5a4]">
              The free trial is designed to get a real kiosk flow running
              quickly so you can evaluate scan speed, admin usability, and
              reporting quality before purchase.
            </p>

            <div className="mt-8 space-y-4">
              {onboardingSteps.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-[#d8c6a8]/10 bg-white/5 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E67300] text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <span className="font-black text-white">{item}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#E67300]/18 bg-[#E67300]/10 p-5">
              <span className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd7ab]" />
                <span className="text-sm leading-7 text-[#fff1dd]">
                  This flow now provisions the tenant, starter subscription, and
                  login account needed to enter the admin console.
                </span>
              </span>
            </div>
          </aside>
        </div>
      </section>
    </PublicSiteShell>
  );
}
