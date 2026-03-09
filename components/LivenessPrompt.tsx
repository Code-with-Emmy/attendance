"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  CircleDot,
  Eye,
  Loader2,
  Smile,
} from "lucide-react";
import type { KioskLivenessStep } from "@/components/attendance-kiosk-types";

type Props = {
  active: boolean;
  stepIndex: number;
  steps: KioskLivenessStep[];
};

const STEP_ICONS = {
  blink: Eye,
  left: ArrowLeft,
  right: ArrowRight,
  up: ArrowUp,
  mouth: CircleDot,
  smile: Smile,
  still: CircleDot,
  tilt: ArrowUpDown,
} as const;

export function LivenessPrompt({ active, stepIndex, steps }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const safeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[safeIndex];
  const progress =
    active && steps.length > 0 ? ((safeIndex + 1) / steps.length) * 100 : 0;
  const CurrentIcon = currentStep ? STEP_ICONS[currentStep.icon] : Eye;

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
      className="kiosk-panel relative overflow-hidden rounded-[1.8rem] border border-white/10 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.34)] sm:px-5 sm:py-5"
      aria-live="polite"
    >
      {/* Top edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_10%,rgba(34,211,238,0.18)_50%,transparent_90%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_34%)]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon container with animated ring */}
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[#3B82F6]/20 bg-[#3B82F6]/12 text-[#7DD3FC] shadow-[0_0_30px_rgba(34,211,238,0.14)] sm:h-14 sm:w-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active ? (currentStep?.id ?? "active") : "idle"}
                  initial={
                    shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  exit={
                    shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <CurrentIcon
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Spinning ring when active */}
            {active && !shouldReduceMotion && (
              <motion.div
                className="absolute -inset-1 rounded-[1.1rem] border-2 border-transparent border-t-[#22D3EE]/40"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            )}
          </div>

          <div className="max-w-2xl">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-400 sm:text-[0.72rem] sm:tracking-[0.34em]">
              {active
                ? `Step ${safeIndex + 1} of ${steps.length} — Liveness Check`
                : "Liveness Engine"}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={active ? (currentStep?.id ?? "active") : "idle"}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.24,
                  ease: "easeOut",
                }}
              >
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:mt-2 sm:text-2xl">
                  {active ? currentStep?.title : "Ready for liveness check"}
                </h2>
                <p className="mt-1.5 text-sm text-slate-400 sm:mt-2 sm:text-base">
                  {active
                    ? currentStep?.instruction
                    : "Turn, nod, smile, tilt, or hold still when prompted. The kiosk begins verification automatically once your face is framed."}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress section */}
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
            <span className="flex items-center gap-2">
              {active && !shouldReduceMotion && (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-[#22D3EE]"
                  aria-hidden="true"
                />
              )}
              Challenge Progress
            </span>
            <span>{active ? `${Math.round(progress)}%` : "Standby"}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8 sm:mt-3 sm:h-3">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#3B82F6,#22D3EE)] shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              animate={{ width: `${progress}%` }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.35,
                ease: "easeOut",
              }}
            />
          </div>

          {/* Step indicators */}
          {steps.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 sm:mt-3 sm:gap-2">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= safeIndex && active
                      ? "bg-[linear-gradient(90deg,#3B82F6,#22D3EE)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
