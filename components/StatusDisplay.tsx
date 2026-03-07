"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { KioskStatus } from "@/components/attendance-kiosk-types";

const TONE_STYLES = {
  scanning: {
    border: "border-[#3B82F6]/20",
    badge: "bg-[#3B82F6]/12 text-[#BFDBFE] ring-1 ring-[#3B82F6]/20",
    glow: "shadow-[0_0_60px_rgba(59,130,246,0.12),0_24px_48px_rgba(2,6,23,0.45)]",
    icon: "◎",
    topEdge: "rgba(59,130,246,0.28)",
  },
  success: {
    border: "border-[#22C55E]/20",
    badge: "bg-[#22C55E]/12 text-[#BBF7D0] ring-1 ring-[#22C55E]/20",
    glow: "shadow-[0_0_60px_rgba(34,197,94,0.12),0_24px_48px_rgba(2,6,23,0.45)]",
    icon: "✓",
    topEdge: "rgba(34,197,94,0.28)",
  },
  warning: {
    border: "border-[#F59E0B]/20",
    badge: "bg-[#F59E0B]/12 text-[#FDE68A] ring-1 ring-[#F59E0B]/20",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.10),0_24px_48px_rgba(2,6,23,0.45)]",
    icon: "⚠",
    topEdge: "rgba(245,158,11,0.28)",
  },
  error: {
    border: "border-[#EF4444]/20",
    badge: "bg-[#EF4444]/12 text-[#FCA5A5] ring-1 ring-[#EF4444]/20",
    glow: "shadow-[0_0_60px_rgba(239,68,68,0.10),0_24px_48px_rgba(2,6,23,0.45)]",
    icon: "✕",
    topEdge: "rgba(239,68,68,0.28)",
  },
} as const;

type Props = {
  status: KioskStatus;
};

export function StatusDisplay({ status }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const toneStyle = TONE_STYLES[status.tone];

  return (
    <motion.section
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
      className={`kiosk-panel relative overflow-hidden rounded-[1.75rem] border px-6 py-5 transition-all duration-500 ${toneStyle.border} ${toneStyle.glow}`}
      aria-live="polite"
    >
      {/* Top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${toneStyle.topEdge} 50%, transparent 90%)`,
        }}
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={status.tone}
              initial={shouldReduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={
                shouldReduceMotion ? undefined : { scale: 0.85, opacity: 0 }
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold ${toneStyle.badge}`}
            >
              {toneStyle.icon}
            </motion.div>
          </AnimatePresence>

          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-[#94A3B8]">
              Attendance Status
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${status.tone}-${status.title}-${status.detail}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.28,
                  ease: "easeOut",
                }}
              >
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#E5E7EB] md:text-3xl">
                  {status.title}
                </h2>
                <p className="mt-2 max-w-3xl text-base text-[#CBD5E1] md:text-lg">
                  {status.detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] ${toneStyle.badge}`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {!shouldReduceMotion && status.tone === "scanning" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
            )}
            <span className="relative h-2.5 w-2.5 rounded-full bg-current" />
          </span>
          {status.tone}
        </span>
      </div>
    </motion.section>
  );
}
