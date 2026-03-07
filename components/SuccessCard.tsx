"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Sparkles, Star, ClockIcon } from "lucide-react";
import type { KioskRecognitionResult } from "@/components/attendance-kiosk-types";

type Props = {
  result: KioskRecognitionResult | null;
};

export function SuccessCard({ result }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {result ? (
        <motion.aside
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            shouldReduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.98 }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 0.32,
            ease: "easeOut",
          }}
          className="relative w-full max-w-md overflow-hidden rounded-[1.8rem] border border-[#22C55E]/18 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.8))] p-4 shadow-[0_24px_48px_rgba(2,6,23,0.42),0_0_0_1px_rgba(34,197,94,0.06),0_0_28px_rgba(34,197,94,0.08)] backdrop-blur-xl sm:p-5"
          aria-live="polite"
        >
          {/* Top edge green highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_5%,rgba(34,197,94,0.3)_50%,transparent_95%)]" />
          {/* Subtle green radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_40%)]" />

          <div className="relative">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Avatar with animated ring */}
              <div className="relative">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[#22C55E]/20 bg-[#22C55E]/12 text-[#BBF7D0] sm:h-16 sm:w-16">
                  {result.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt={result.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-semibold sm:text-lg">
                      {result.avatarLabel}
                    </span>
                  )}
                </div>
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute -inset-1 rounded-[1.1rem] border border-[#22C55E]/20"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.06, 1],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-emerald-300 sm:gap-2 sm:text-[0.72rem] sm:tracking-[0.34em]">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Clock Event Confirmed
                </div>
                <h3 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-white sm:mt-2 sm:text-2xl">
                  {result.fullName}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {result.department || "Employee record matched"}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="mt-4 grid gap-2.5 rounded-[1.2rem] border border-white/10 bg-white/5 p-3 sm:mt-5 sm:gap-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Action</span>
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <Star
                    className="h-3 w-3 text-[#22C55E] sm:h-3.5 sm:w-3.5"
                    aria-hidden="true"
                  />
                  {result.actionLabel}
                </span>
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Time</span>
                <span className="flex items-center gap-2 font-mono text-sm text-white">
                  <ClockIcon
                    className="h-3 w-3 text-slate-400 sm:h-3.5 sm:w-3.5"
                    aria-hidden="true"
                  />
                  {result.timeLabel}
                </span>
              </div>
              <div className="h-px bg-white/8" />
              {typeof result.confidence === "number" ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Confidence</span>
                  <div className="flex items-center gap-2">
                    {/* Mini confidence bar */}
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#22C55E,#22D3EE)]"
                        style={{
                          width: `${Math.min(result.confidence, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {result.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">Secure Match</span>
                  <span className="text-sm font-medium text-white">
                    Verified server-side
                  </span>
                </div>
              )}
            </div>

            {/* Success message */}
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{result.message}</span>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
