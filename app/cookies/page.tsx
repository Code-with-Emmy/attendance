import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-200 font-(family-name:--font-lato)">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-4">
          <BrandLogo size="md" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
            Cookie Policy
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Site and kiosk storage
          </h1>
          <p className="text-base font-bold leading-relaxed text-slate-400">
            This page explains browser storage used by the public site, admin
            app, and kiosk device activation flow.
          </p>
        </div>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">What is stored</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            The product may use local storage, session storage, and auth cookies
            to maintain kiosk activation, admin authentication, and basic UI
            preferences.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Why it is needed</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Storage keeps the kiosk bound to an approved device, preserves
            authenticated admin sessions, and supports offline attendance sync
            when connectivity is unstable.
          </p>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black text-white">Managing preferences</h2>
          <p className="text-sm font-bold leading-relaxed text-slate-400">
            Users can clear browser data locally, but clearing kiosk storage may
            require reactivation with a valid device token. Document that in
            your customer rollout guides.
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
