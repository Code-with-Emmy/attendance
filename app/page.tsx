import { Metadata } from "next";
import {
  Calculator,
  Database,
  EyeOff,
  FileText,
  Fingerprint,
  Lock,
  UserX,
} from "lucide-react";
import { CTASection } from "@/components/CTASection";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { PricingPreview } from "@/components/PricingPreview";
import { ProductScreenshots } from "@/components/ProductScreenshots";
import { listActivePlans } from "@/lib/billing/getPlanByCode";
import { problemPoints } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "AttendanceKiosk | Face-Verified Attendance for Modern Workplaces",
};

export const dynamic = "force-dynamic";

const problemIcons = [UserX, FileText, Calculator, EyeOff];
const securityItems = [
  {
    icon: Fingerprint,
    title: "Face embeddings instead of raw photos",
    description:
      "Verification is designed around face embeddings so organizations can minimize raw image retention.",
  },
  {
    icon: FileText,
    title: "Tamper-evident audit logs",
    description:
      "Attendance events and admin changes are recorded for review and operational accountability.",
  },
  {
    icon: Lock,
    title: "Role-based admin access",
    description:
      "Separate permissions for HR, operations, branch managers, and finance reduce unnecessary exposure.",
  },
  {
    icon: Database,
    title: "Secure Postgres database",
    description:
      "Attendance data, devices, and organization settings are backed by durable database storage.",
  },
];

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-slate-400">{body}</p>
    </div>
  );
}

export default async function HomePage() {
  const plans = await listActivePlans();

  return (
    <div className="min-h-screen bg-[#020617] text-[#E5E7EB]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.08),transparent_18%)]" />
      <Navbar />
      <main>
        <Hero />

        <section className="border-y border-white/10 bg-[#020617]">
          <div className="site-container py-20">
            <SectionIntro
              eyebrow="The Problem"
              title="Manual attendance is outdated."
              body="Paper sheets, shared PINs, and manual reconciliation make attendance unreliable. AttendanceKiosk replaces weak check-ins with a secure biometric workflow that updates instantly."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {problemPoints.map((item, index) => {
                const Icon = problemIcons[index] ?? FileText;

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.6rem] border border-white/10 bg-[rgba(15,23,42,0.85)] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#93C5FD]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <Features />
        <HowItWorks />
        <ProductScreenshots />

        <section id="security" className="bg-[#020617]">
          <div className="site-container py-20">
            <SectionIntro
              eyebrow="Security"
              title="Security and privacy by design."
              body="AttendanceKiosk is built for organizations that need strong verification, disciplined access control, and auditability from kiosk device to database."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {securityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.6rem] border border-white/10 bg-[rgba(15,23,42,0.85)] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#93C5FD]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <PricingPreview plans={plans} />

        <CTASection
          title="Ready to modernize your attendance system?"
          description="Book a guided demo, start a free trial, or move directly into a production rollout with a secure biometric kiosk flow your team can trust."
        />
      </main>
      <Footer />
    </div>
  );
}
