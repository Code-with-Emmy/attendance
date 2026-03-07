import { Metadata } from "next";
import { CheckCircle2, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { DemoForm } from "@/components/DemoForm";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const metadata: Metadata = {
  title: "Book Demo",
};

export default function DemoPage() {
  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <DemoForm />

          <aside className="space-y-6">
            <section className="site-card rounded-[2rem] p-7">
              <p className="section-label">Why Book a Demo</p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    title: "See the kiosk flow live",
                    description:
                      "Understand how the liveness verification and attendance capture experience works on shared devices.",
                    icon: MonitorSmartphone,
                  },
                  {
                    title: "Review security posture",
                    description:
                      "Talk through embeddings, access control, audit logs, and device trust requirements.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Map deployment fit",
                    description:
                      "Align your branch count, team size, and payroll flow with the right rollout path.",
                    icon: CheckCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-blue-200">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="site-card rounded-[2rem] p-7">
              <p className="section-label">What the Demo Covers</p>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                <li className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
                  Kiosk setup and device registration
                </li>
                <li className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
                  Admin dashboard, reports, and exception handling
                </li>
                <li className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
                  Deployment walkthrough and onboarding expectations
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </PublicSiteShell>
  );
}
