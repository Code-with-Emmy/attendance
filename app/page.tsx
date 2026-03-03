"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [hasCustomerSession, setHasCustomerSession] = useState(false);

  useEffect(() => {
    const kioskToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("kiosk_token")
        : null;

    if (kioskToken) {
      router.replace("/kiosk");
    }
  }, [router]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setHasCustomerSession(Boolean(data.session));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasCustomerSession(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 font-(family-name:--font-lato) text-slate-200 selection:bg-cyan-500/30">
      {/* 1) Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex h-14 items-center justify-between md:h-[4.5rem]">
            <BrandLogo size="sm" className="h-12 w-12 md:h-[4.5rem] md:w-[4.5rem]" />

            <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <a href="#product" className="hover:text-white transition-colors">
                Product
              </a>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#security" className="hover:text-white transition-colors">
                Security
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>

            <div className="hidden shrink-0 items-center justify-end gap-3 md:flex md:gap-4">
              {hasCustomerSession ? (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors"
                  >
                    Admin Login
                  </Link>
                  <Link
                    href="/kiosk"
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg px-6 text-[10px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  >
                    Open Kiosk
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href="#contact"
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-950 transition-colors hover:bg-cyan-50"
                  >
                    Book a Demo
                  </a>
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-cyan-600 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.4)]"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="pt-3 md:hidden">
            {hasCustomerSession ? (
              <Link
                href="/kiosk"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-cyan-600 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-cyan-500"
              >
                Open Kiosk
              </Link>
            ) : (
              <a
                href="#contact"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-cyan-600 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-cyan-500"
              >
                Book a Demo
              </a>
            )}
          </div>
        </div>
      </nav>

      <a
        href="#contact"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 items-center justify-center rounded-full bg-cyan-500 px-7 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-[0_18px_48px_rgba(8,145,178,0.35)] transition-colors hover:bg-cyan-400"
      >
        Book a Demo
      </a>

      {/* 2) Hero */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden mx-auto max-w-7xl px-6 lg:px-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.1]">
            Face-Verified Clock-In/Out for Teams That Need{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500">
              Accuracy.
            </span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn any tablet or browser into a secure attendance kiosk.{" "}
            <br className="hidden md:block" />
            Built-in liveness checks, instant face matching, and real-time
            reporting — no manual timesheets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/kiosk"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-cyan-600 text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_30px_rgba(8,145,178,0.3)] hover:shadow-[0_0_40px_rgba(8,145,178,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" /> Open Kiosk
            </Link>
            <a
              href="#contact"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-cyan-600 text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_30px_rgba(8,145,178,0.3)] hover:shadow-[0_0_40px_rgba(8,145,178,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" /> Book a Demo
            </a>
            <a
              href="#product"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              Watch 60-Second Walkthrough
            </a>
          </div>

          <div className="pt-12 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Used by offices, schools, clinics, retail, and operations teams.
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-500" />{" "}
                Liveness-Protected
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-500" /> Instant
                Recognition
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-cyan-500" /> Payroll-Ready
                Reports
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="pt-16 md:pt-24 mt-8 relative max-w-5xl mx-auto hidden md:block w-full"
          >
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent z-20 pointer-events-none rounded-t-[2.5rem]" />
            <div className="relative z-10 rounded-[2.5rem] bg-slate-900 border border-white/10 p-4 shadow-2xl flex flex-col gap-6 transform perspective-1000 rotate-x-[5deg] scale-100 hover:scale-[1.02] transition-transform duration-700 ease-in-out">
              <div className="flex items-center gap-2 px-4 pb-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Admin Dashboard
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 px-2">
                <div className="col-span-1 space-y-4">
                  <div className="h-8 rounded focus:outline-none w-3/4 bg-white/5" />
                  <div className="h-4 rounded focus:outline-none w-1/2 bg-white/5" />
                  <div className="h-4 rounded focus:outline-none w-2/3 bg-white/5" />
                  <div className="h-4 rounded focus:outline-none w-1/2 bg-white/5" />
                </div>
                <div className="col-span-3 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-end p-4">
                      <div className="w-2/3 h-2 bg-cyan-500/50 rounded" />
                    </div>
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-end p-4">
                      <div className="w-1/2 h-2 bg-cyan-500/50 rounded" />
                    </div>
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-end p-4">
                      <div className="w-3/4 h-2 bg-rose-500/50 rounded" />
                    </div>
                  </div>
                  <div className="h-96 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-8 left-8 right-8 space-y-6">
                      <div className="w-full h-8 bg-white/10 rounded flex items-center px-4">
                        <div className="w-1/6 h-3 bg-white/20 rounded" />
                      </div>
                      <div className="w-full h-8 bg-white/5 rounded flex items-center px-4">
                        <div className="w-1/4 h-3 bg-white/20 rounded" />
                      </div>
                      <div className="w-full h-8 bg-white/5 rounded flex items-center px-4">
                        <div className="w-1/5 h-3 bg-cyan-500/50 rounded" />
                      </div>
                      <div className="w-full h-8 bg-white/5 rounded flex items-center px-4">
                        <div className="w-1/3 h-3 bg-white/20 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 3) Social Proof Strip */}
      <section className="border-y border-white/5 bg-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">
            Trusted by modern teams
          </p>
          <div className="flex justify-center gap-12 md:gap-24 opacity-60 grayscale flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-black text-white">40%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Reduce time theft
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-black text-white">15h</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Cut HR admin time / mo
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-black text-white">100%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Accurate attendance logs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Problem Section */}
      <section
        className="py-24 lg:py-32 mx-auto max-w-7xl px-6 lg:px-8"
        id="product"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Attendance shouldn’t be a daily fight.
          </h2>
          <p className="text-lg font-bold text-cyan-500">
            Your operations run better when attendance is automatic, verifiable,
            and auditable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                “Buddy punching” & fake clock-ins
              </h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                Pin codes and proximity cards are shared easily among employees,
                costing companies thousands in stolen time.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                Manual timesheets & HR errors
              </h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                Collating paper timesheets or chasing messy spreadsheets delays
                payroll and introduces massive compliance risks.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12h20" />
                <path d="M12 2v20" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                No real-time visibility
              </h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                Supervisors don’t know who’s actually on-site until the end of
                the shift, making operational adjustments impossible.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                Staff disputes
              </h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                "I was here" vs "The system says no." Stop arguing over missing
                punches when every event is backed by a tamper-evident audit
                trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5) How It Works */}
      <section className="py-24 bg-slate-900 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
              How It Works
            </h2>
            <p className="text-lg font-bold text-slate-400">
              Three simple steps to secure, audit-ready time tracking.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-linear-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-cyan-400 shadow-xl">
                1
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Open Kiosk
              </h3>
              <p className="text-sm font-bold text-slate-400">
                Launch the kiosk securely on any tablet or laptop — it’s
                touch-friendly, blazingly fast, and locks securely to your org.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-cyan-400 shadow-xl">
                2
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Liveness + Face Match
              </h3>
              <p className="text-sm font-bold text-slate-400">
                The camera runs a physical liveness challenge (like a blink or
                head turn) and securely verifies the employee instantly using a
                1:N neural network.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-cyan-400 shadow-xl">
                3
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Log + Report
              </h3>
              <p className="text-sm font-bold text-slate-400">
                Clock events are recorded to the immutable ledger instantly and
                populate the dashboard with a tamper-evident timeline and
                exportable payroll reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6) Setup */}
      <section className="py-24 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
              Setup in 10 minutes
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
              Launch one site fast, then scale by location.
            </h2>
            <p className="max-w-2xl text-lg font-bold text-slate-400">
              The first deployment is intentionally simple: create an
              organization, enroll your team, bind a kiosk, and start capturing
              attendance in one session.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <ol className="space-y-5">
              {[
                "Create your organization and admin account",
                "Add employees and complete face enrollment",
                "Generate a kiosk activation token",
                "Bind a tablet or laptop to your organization",
                "Start clocking and review the live activity feed",
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-black text-cyan-300">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-300">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 7) Features Grid */}
      <section
        className="py-24 lg:py-32 mx-auto max-w-7xl px-6 lg:px-8"
        id="features"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Built for accuracy. Designed for speed.
          </h2>
          <p className="text-lg font-bold text-slate-400">
            A robust feature set powering next-gen workforces.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" x2="12" y1="8" y2="8" />
                <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Liveness Challenge
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Prevents photo spoofing attempts and guarantees the employee is
              physically present.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              1:N Face Matching
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Automatically identifies staff from hundreds of enrolled active
              employees seamlessly.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-rose-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Blocks Unknown Faces
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Zero unauthorized access. No enrollment in the company roster = no
              clocking.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Duplicate Protection
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Safeguards your timeline by preventing double clock-ins and
              invalid clock-outs.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Recent Activity Feed
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Managers and supervisors can see exactly who clocked in or out in
              real time.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors space-y-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="3" x2="21" y1="9" y2="9" />
                <line x1="9" x2="9" y1="21" y2="9" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Admin Dashboard & Payroll
            </h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Manage employees, view attendance timelines, define periods, and
              export reports.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 8) Security & Compliance */}
      <section
        className="py-24 bg-slate-900 border-y border-white/5"
        id="security"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight">
                Security-first <br />
                by design.
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-md font-black text-white">
                      Privacy Protected Analytics
                    </h4>
                    <p className="text-sm font-bold text-slate-400">
                      We store embeddings (mathematical vectors), not raw
                      images, inside secure PostgreSQL + pgvector stores.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" x2="8" y1="13" y2="13" />
                      <line x1="16" x2="8" y1="17" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-md font-black text-white">
                      Full Event Audits
                    </h4>
                    <p className="text-sm font-bold text-slate-400">
                      Complete immutable audit trail for every single clock
                      activity, block, constraint failure, and kiosk session
                      attempt.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-md font-black text-white">
                      Role-Based Constraints
                    </h4>
                    <p className="text-sm font-bold text-slate-400">
                      Admin-only access to employee enrollment, deletion,
                      schedule assignment and payroll extraction securely scoped
                      to organizations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative aspect-square rounded-3xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.1)_0%,transparent_100%)]" />
              <div className="relative text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-cyan-400"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Database Backed.
                </h3>
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                  PostgreSQL + PGVector
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9) FAQ */}
      <section className="py-24 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
            FAQ
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            Questions teams ask before they roll this out.
          </h2>
          <p className="text-lg font-bold text-slate-400">
            Face products need clear answers. Put the risk and privacy questions
            on the page before your buyers have to ask.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            {
              question: "Do you store photos or only embeddings?",
              answer:
                "The platform stores face embeddings for recognition and uses a server-controlled audit trail. Raw photo retention should stay optional and policy-driven.",
            },
            {
              question: "What happens when recognition fails?",
              answer:
                "The kiosk rejects the attempt, records the failure path, and lets the employee retry. Admins can review activity and re-enroll if needed.",
            },
            {
              question: "What does the liveness check do?",
              answer:
                "The kiosk asks the employee to complete a live action such as a blink before a match is accepted, reducing photo and replay spoofing.",
            },
            {
              question: "Can admins edit clock records silently?",
              answer:
                "The current product keeps event history and exception handling in the admin workflow. Position it as tamper-evident and auditable rather than unchangeable.",
            },
          ].map((item) => (
            <div
              key={item.question}
              className="rounded-3xl border border-white/10 bg-white/5 p-7"
            >
              <h3 className="text-lg font-black text-white">{item.question}</h3>
              <p className="mt-3 text-sm font-bold leading-relaxed text-slate-400">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 10) Use Cases */}
      <section className="py-24 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-12">
          Perfect for organizations that manage people on-site.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            "Offices & Agencies",
            "Schools & Training Centers",
            "Clinics & Hospitals",
            "Warehouses & Factories",
            "Retail & Hospitality",
          ].map((tag) => (
            <span
              key={tag}
              className="px-6 py-3 rounded-full bg-white/[0.03] border border-white/10 text-sm font-bold text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 11) Pricing */}
      <section
        className="py-24 bg-slate-950 border-t border-white/5"
        id="pricing"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
              Transparent Pricing
            </h2>
            <p className="text-lg font-bold text-slate-400">
              Invest in accuracy. Scale fearlessly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Starter */}
            <div className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 space-y-6 flex flex-col h-[400px] transition-colors">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                  Starter
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-2">
                  Perfect for small teams.
                </p>
              </div>
              <div className="text-4xl font-black text-white">
                $29<span className="text-sm font-bold text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 flex-1 text-sm font-bold text-slate-400">
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> Up to
                  10 Employees
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> 1
                  Kiosk Device
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> Basic
                  Attendance
                </li>
              </ul>
            </div>

            {/* Growth */}
            <div className="p-8 rounded-3xl bg-linear-to-b from-cyan-900/40 to-cyan-900/10 border-2 border-cyan-500/50 space-y-6 flex flex-col relative h-[440px] transform md:-translate-y-4 shadow-[0_0_40px_rgba(8,145,178,0.2)]">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                  Growth
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-2">
                  For scaling businesses.
                </p>
              </div>
              <div className="text-4xl font-black text-white">
                $99<span className="text-sm font-bold text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 flex-1 text-sm font-bold text-slate-400">
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> Up to
                  50 Employees
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> 3
                  Kiosk Devices
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Roster Shifts
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Payroll Exporting
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 space-y-6 flex flex-col h-[400px] transition-colors">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                  Pro
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-2">
                  Full capabilities.
                </p>
              </div>
              <div className="text-4xl font-black text-white">
                $249
                <span className="text-sm font-bold text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 flex-1 text-sm font-bold text-slate-400">
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> Up to
                  200 Employees
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> 10
                  Kiosk Devices
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" /> Shift
                  Management
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Priority Support
                </li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 space-y-6 flex flex-col h-[400px] transition-colors">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                  Enterprise
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-2">
                  Unlimited power.
                </p>
              </div>
              <div className="text-4xl font-black text-white">Custom</div>
              <ul className="space-y-4 flex-1 text-sm font-bold text-slate-400">
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Unlimited Employees
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Unlimited Kiosks
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Dedicated Account Manager
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="w-5 h-5 text-cyan-500 shrink-0" />{" "}
                  Custom integrations
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="#contact"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-8 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-slate-200 mx-auto"
            >
              View Full Pricing & Book Demo{" "}
              <ArrowRightIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 12) Final CTA Block */}
      <section className="py-32 relative overflow-hidden" id="contact">
        <div className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-cyan-900/40 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center space-y-8"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
            Ready to eliminate time theft & payroll confusion?
          </h2>
          <p className="text-xl font-bold text-slate-300">
            Start with a demo, or launch a free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <a
              href="#contact"
              className="flex h-16 w-full items-center justify-center rounded-xl bg-cyan-600 px-10 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-cyan-500 shadow-xl hover:shadow-cyan-500/50 transform hover:-translate-y-1 sm:w-auto"
            >
              Book a Demo
            </a>
            <Link
              href="/login"
              className="flex h-16 w-full items-center justify-center rounded-xl bg-white px-10 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-slate-200 shadow-xl transform hover:-translate-y-1 sm:w-auto"
            >
              Start Free Trial
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 11) Footer */}
      <footer className="py-12 border-t border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <BrandLogo size="sm" />
            <p className="text-xs font-bold text-slate-500 pr-4">
              Automated, verifiable, and secure attendance powered by neural
              networks.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Product
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-500">
              <li>
                <a href="#features" className="hover:text-cyan-400">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-cyan-400">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/kiosk" className="hover:text-cyan-400">
                  Kiosk Mode
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-500">
              <li>
                <a href="#product" className="hover:text-cyan-400">
                  About
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-cyan-400">
                  Security
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-cyan-400">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Legal
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-cyan-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-cyan-400">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <p>
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <p>Deployed securely.</p>
        </div>
      </footer>
    </main>
  );
}
