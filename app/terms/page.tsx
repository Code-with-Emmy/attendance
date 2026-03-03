import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-200 font-(family-name:--font-lato)">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-4">
          <BrandLogo size="md" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
            Terms of Service
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Using the Attendance System
          </h1>
          <p className="text-base font-bold leading-relaxed text-slate-400">
            These terms set the baseline operating rules for organizations using
            the kiosk, admin tools, attendance reporting, and device
            registration workflow.
          </p>
        </div>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Authorized use</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Customers are responsible for limiting enrollment, device access,
            and admin permissions to authorized personnel. Device credentials
            must be protected as operational secrets.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Customer obligations</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Customers should obtain any employee consents required by local law,
            configure retention policies, and validate payroll outputs before
            making employment decisions.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Service limitations</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            The product is designed to provide a tamper-evident audit trail and
            operational reporting. It should not be marketed as an infallible or
            legally determinative source of truth in every jurisdiction.
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
