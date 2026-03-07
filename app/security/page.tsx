import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { securityPrinciples } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Security",
};

export default function SecurityPage() {
  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="section-label">Security and Privacy</p>
            <h1 className="mt-4 section-heading text-white">
              Built to support biometric attendance with privacy-aware system
              design.
            </h1>
            <p className="section-copy mt-5">
              AttendanceKiosk is positioned for organizations that need secure
              attendance workflows, strong audit posture, and clear control over
              kiosk devices and administrative access.
            </p>
          </div>

          <div className="site-card rounded-[2rem] p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-400/18 bg-blue-500/10 p-3 text-blue-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Trust architecture
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Security language aligned to biometric attendance workflows.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-slate-950/50 p-5">
              <p className="text-sm leading-7 text-slate-300">
                Use this page to communicate how your deployment handles face
                embeddings, liveness, auditability, device management, and
                backend storage decisions. Expand with jurisdiction-specific
                policy details before launch.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {securityPrinciples.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="site-card rounded-[1.7rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/18 bg-blue-500/10 text-blue-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </PublicSiteShell>
  );
}
