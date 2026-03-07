"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  label?: string;
  compact?: boolean;
};

export function BrandLoader({
  label = "Connecting...",
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300 backdrop-blur-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
        </span>
        {label}
      </div>
    );
  }

  return (
    <main className="fixed inset-0 z-50 flex h-dvh w-screen items-center justify-center overflow-hidden bg-[#020617] p-6 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.08),transparent_26%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[72px_72px]" />
        <div className="absolute left-[10%] top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[12%] top-28 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-10 text-center shadow-[0_30px_120px_rgba(2,6,23,0.72)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-300/50 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="mx-auto flex h-24 items-center justify-center mb-8">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative flex items-center justify-center drop-shadow-[0_0_25px_rgba(96,165,250,0.15)]"
            >
              <BrandLogo size="lg" className="h-20 w-auto" />
            </motion.div>
          </div>

          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-blue-200">
            AttendanceKiosk
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white">
            Preparing your workspace
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">{label}</p>

          <div className="mt-8 overflow-hidden rounded-full border border-white/8 bg-white/5 p-1">
            <motion.div
              className="h-2 rounded-full bg-linear-to-r from-blue-500 via-cyan-300 to-emerald-400"
              initial={{ x: "-65%" }}
              animate={{ x: "110%" }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-2 w-2 rounded-full bg-slate-500"
                animate={{
                  scale: [1, 1.5, 1],
                  backgroundColor: [
                    "rgb(100 116 139)",
                    "rgb(96 165 250)",
                    "rgb(100 116 139)",
                  ],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.16,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
