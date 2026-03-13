"use client";

import { motion } from "framer-motion";
import { featureItems } from "@/lib/site-content";

export function Features() {
  return (
    <section id="features" className="border-y border-white/10 bg-[#020617]">
      <div className="site-container py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
            Features
          </p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Built for accuracy, security, and scale.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            From kiosk verification to payroll-ready exports, AttendanceKiosk
            gives operations teams one reliable system for workforce attendance.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureItems.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group rounded-[1.6rem] border border-white/10 bg-[rgba(15,23,42,0.85)] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#3B82F6]/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#93C5FD]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
