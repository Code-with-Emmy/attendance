"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ScanFace,
  ShieldAlert,
} from "lucide-react";
import type { KioskUiStatus } from "@/components/attendance-kiosk-types";

type Props = {
  status: KioskUiStatus;
};

const TONE_STYLES = {
  idle: {
    Icon: ScanFace,
    border: "border-white/10",
    outerGlow: "",
    iconWrap: "border-white/10 bg-slate-950/40 text-blue-300",
    badge: "bg-white/5 text-slate-300 ring-1 ring-white/10",
    topEdge: "rgba(148,163,184,0.08)",
    accentGlow: "rgba(59,130,246,0.06)",
  },
  scanning: {
    Icon: Activity,
    border: "border-[#3B82F6]/20",
    outerGlow: "shadow-[0_0_60px_rgba(59,130,246,0.10)]",
    iconWrap: "border-[#3B82F6]/20 bg-blue-500/12 text-blue-300",
    badge: "bg-blue-500/12 text-blue-200 ring-1 ring-[#3B82F6]/20",
    topEdge: "rgba(59,130,246,0.28)",
    accentGlow: "rgba(59,130,246,0.10)",
  },
  success: {
    Icon: CheckCircle2,
    border: "border-[#22C55E]/20",
    outerGlow: "shadow-[0_0_60px_rgba(34,197,94,0.10)]",
    iconWrap: "border-[#22C55E]/20 bg-emerald-500/12 text-emerald-300",
    badge: "bg-emerald-500/12 text-emerald-200 ring-1 ring-[#22C55E]/20",
    topEdge: "rgba(34,197,94,0.28)",
    accentGlow: "rgba(34,197,94,0.08)",
  },
  warning: {
    Icon: AlertTriangle,
    border: "border-[#F59E0B]/20",
    outerGlow: "shadow-[0_0_60px_rgba(245,158,11,0.08)]",
    iconWrap: "border-[#F59E0B]/20 bg-amber-500/12 text-amber-300",
    badge: "bg-amber-500/12 text-amber-200 ring-1 ring-[#F59E0B]/20",
    topEdge: "rgba(245,158,11,0.28)",
    accentGlow: "rgba(245,158,11,0.06)",
  },
  error: {
    Icon: ShieldAlert,
    border: "border-[#EF4444]/20",
    outerGlow: "shadow-[0_0_60px_rgba(239,68,68,0.08)]",
    iconWrap: "border-[#EF4444]/20 bg-red-500/12 text-red-300",
    badge: "bg-red-500/12 text-red-200 ring-1 ring-[#EF4444]/20",
    topEdge: "rgba(239,68,68,0.28)",
    accentGlow: "rgba(239,68,68,0.06)",
  },
} as const;

export function StatusPanel({ status }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const tone = TONE_STYLES[status.tone];
  const Icon = tone.Icon;
  const isAnimatingTone = status.tone === "scanning";

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: "easeOut" }}
      className={`kiosk-panel relative overflow-hidden rounded-[1.8rem] border px-4 py-4 transition-all duration-500 sm:px-6 sm:py-5 ${tone.border} ${tone.outerGlow} shadow-[0_18px_40px_rgba(2,6,23,0.34)]`}
      aria-live="polite"
    >
      {/* Dynamic top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${tone.topEdge} 50%, transparent 90%)`,
        }}
      />
      {/* Subtle radial glow that matches the tone */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at top right, ${tone.accentGlow}, transparent 30%)`,
        }}
      />

      <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon with animated entrance */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status.tone}
              initial={shouldReduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={
                shouldReduceMotion ? undefined : { scale: 0.85, opacity: 0 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.25,
                ease: "easeOut",
              }}
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border shadow-[0_18px_42px_rgba(2,6,23,0.22)] sm:h-16 sm:w-16 ${tone.iconWrap}`}
            >
              {isAnimatingTone && !shouldReduceMotion ? (
                <Loader2
                  className="h-5 w-5 animate-spin sm:h-7 sm:w-7"
                  aria-hidden="true"
                />
              ) : (
                <Icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
              {status.eyebrow}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${status.tone}-${status.title}-${status.detail}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.24,
                  ease: "easeOut",
                }}
              >
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:mt-2 sm:text-2xl md:text-3xl md:text-[2.15rem]">
                  {status.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-300 sm:mt-2 sm:text-base md:text-lg">
                  {status.detail}
                </p>
                <p className="mt-3 text-sm text-slate-500">{status.helper}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${tone.badge}`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {!shouldReduceMotion &&
              (status.tone === "scanning" || status.tone === "success") && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
              )}
            <span className="relative h-2.5 w-2.5 rounded-full bg-current" />
          </span>
          {status.tone}
        </span>
      </div>

      {status.meta?.length ? (
        <div className="relative mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4 sm:mt-5 sm:gap-3 sm:pt-5">
          {status.meta.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
