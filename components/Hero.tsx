"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { trustBullets } from "@/lib/site-content";

export function Hero() {
  return (
    <section
      id="product"
      className="site-container grid gap-12 py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <span className="site-pill">
          <ShieldCheck className="h-4 w-4 text-blue-300" />
          Trusted biometric attendance for modern teams
        </span>

        <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3rem,7vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white">
          Face-Verified Attendance for{" "}
          <span className="highlight-text">Modern Workplaces</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Turn any tablet or laptop into a secure biometric kiosk with liveness
          verification, real-time attendance tracking, and payroll-ready
          reporting.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/demo" className="cta-primary">
            Book a Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/trial" className="cta-secondary">
            Start Free Trial
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {trustBullets.map((item) => (
            <div
              key={item}
              className="site-card-soft rounded-3xl px-4 py-4 text-sm text-slate-300"
            >
              <span className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        className="relative"
      >
        <div className="absolute -left-8 top-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-8 bottom-4 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="site-card relative overflow-hidden rounded-[2rem] p-5 shadow-[0_30px_120px_rgba(2,6,23,0.7)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_40%)]" />
          <div className="relative rounded-[1.6rem] border border-white/8 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Attendance kiosk
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  Reception scanner
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Live
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] p-5">
              <div className="relative flex aspect-[4/5] items-center justify-center rounded-[1.4rem] border border-blue-400/15 bg-slate-950/50">
                <div className="absolute inset-6 rounded-[1.2rem] border border-dashed border-blue-300/25" />
                <div className="absolute left-8 top-8 h-10 w-10 border-l-2 border-t-2 border-cyan-300" />
                <div className="absolute right-8 top-8 h-10 w-10 border-r-2 border-t-2 border-cyan-300" />
                <div className="absolute bottom-8 left-8 h-10 w-10 border-b-2 border-l-2 border-cyan-300" />
                <div className="absolute bottom-8 right-8 h-10 w-10 border-b-2 border-r-2 border-cyan-300" />
                <div className="rounded-[1.4rem] border border-cyan-300/20 bg-cyan-400/10 p-6 shadow-[0_0_60px_rgba(34,211,238,0.15)]">
                  <Camera className="h-14 w-14 text-cyan-200" />
                </div>
                <div className="absolute inset-x-8 top-[22%] h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Match
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">98.4%</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Liveness
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">
                    Verified
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-lg font-semibold text-blue-200">
                    Clocked in
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Attendance health
              </p>
              <div className="mt-4 flex items-end gap-2">
                {[44, 70, 52, 88, 65, 94, 74].map((value, index) => (
                  <div
                    key={value + index}
                    className="flex-1 rounded-t-full bg-gradient-to-t from-blue-500 to-cyan-300"
                    style={{ height: `${value}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Live insights
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-3 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <Activity className="h-4 w-4 text-blue-300" />
                    Active kiosks
                  </span>
                  <span className="font-semibold text-white">12</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-3 py-3">
                  <span className="text-sm text-slate-300">Late arrivals</span>
                  <span className="font-semibold text-amber-300">3 flagged</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-3 py-3">
                  <span className="text-sm text-slate-300">Export status</span>
                  <span className="font-semibold text-emerald-300">
                    Payroll ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
