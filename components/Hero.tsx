"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";
import { trustBullets } from "@/lib/site-content";

export function Hero() {
  return (
    <section
      id="product"
      className="relative overflow-hidden border-b border-white/10 bg-[#020617] pt-16"
    >
      <div className="absolute inset-0">
        <Image
          src={siteAssets.heroBackdrop}
          alt="Employee using a self-service kiosk in a real workplace environment"
          fill
          priority
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.88)_38%,rgba(2,6,23,0.6)_70%,rgba(2,6,23,0.52)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_22%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="site-container relative grid gap-14 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck className="h-4 w-4 text-[#3B82F6]" />
            Facial recognition attendance with liveness verification
          </div>

          <h1 className="mt-8 max-w-3xl font-heading text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
            Face-Verified Attendance for Modern Workplaces
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Turn any tablet or laptop into a secure biometric attendance kiosk
            with built-in liveness detection, real-time attendance logs, and
            payroll-ready reporting.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:bg-[#60A5FA]"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/trial"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
            >
              Start Free Trial
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {trustBullets.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-200 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#22C55E]" />
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full bg-[#3B82F6]/20 blur-3xl lg:block" />
          <div className="absolute -right-6 bottom-8 hidden h-36 w-36 rounded-full bg-[#22C55E]/16 blur-3xl lg:block" />

          <div className="ml-auto w-full max-w-[34rem] rounded-[2rem] border border-white/10 bg-[rgba(15,23,42,0.72)] p-4 shadow-[0_30px_120px_rgba(2,6,23,0.5)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="relative aspect-[16/11] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0F172A]">
              <Image
                src={siteAssets.heroProduct}
                alt="AttendanceKiosk product interface"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
