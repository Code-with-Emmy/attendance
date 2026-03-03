import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-200 font-(family-name:--font-lato)">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-4">
          <BrandLogo size="md" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
            Privacy Policy
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Attendance System
          </h1>
          <p className="text-base font-bold leading-relaxed text-slate-400">
            This page explains how attendance data, device identifiers, and
            biometric embeddings are handled in the product. Use it as the live
            public policy page and expand the legal language before production
            launch.
          </p>
        </div>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">What we collect</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            The platform processes employee profile information, attendance
            events, kiosk device identifiers, and facial embeddings used for
            verification. Raw image retention should remain optional and
            governed by your internal policy.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">How it is used</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Data is used to verify attendance, produce audit-ready records,
            support payroll reporting, and secure kiosk access. Access should be
            limited to authorized administrators and approved backend services.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Retention and access</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Retention periods, deletion timelines, and data-subject rights
            should be aligned with local employment and privacy law before
            customer rollout. This page is a product-facing baseline, not legal
            advice.
          </p>
        </section>

        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-950"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
