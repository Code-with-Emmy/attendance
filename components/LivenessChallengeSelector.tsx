"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  CircleDot,
  Eye,
  ListRestart,
  ScanFace,
  Smile,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  challengeButtonLabel,
  challengeLabel,
  LIVENESS_CHALLENGES,
  type LivenessChallenge,
  type LivenessChallengeSelection,
} from "@/lib/liveness";

type Props = {
  selectedChallenge: LivenessChallengeSelection;
  onSelect: (challenge: LivenessChallengeSelection) => void;
  disabled?: boolean;
};

const CHALLENGE_ICONS: Record<LivenessChallenge, LucideIcon> = {
  BLINK: Eye,
  TURN_HEAD: Undo2,
  OPEN_MOUTH: CircleDot,
  NOD_HEAD: ScanFace,
  SMILE: Smile,
  TILT_HEAD: ArrowUpDown,
};

export function LivenessChallengeSelector({
  selectedChallenge,
  onSelect,
  disabled = false,
}: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
      className="kiosk-panel relative overflow-hidden rounded-[1.8rem] border border-white/10 px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Liveness challenge selector"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_8%,rgba(59,130,246,0.18)_38%,rgba(34,211,238,0.14)_62%,transparent_92%)]" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-slate-400 sm:text-[0.68rem] sm:tracking-[0.3em]">
              Liveness Fallback
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Stay on auto, choose manual when needed
            </h2>
            <p className="mt-1.5 text-xs font-medium text-slate-400 sm:mt-2 sm:text-sm">
              The kiosk starts on Auto. Choose a manual challenge only when you
              want to override the random prompt.
            </p>
          </div>

          <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-300 sm:px-3 sm:py-2 sm:text-[0.66rem] sm:tracking-[0.22em]">
            <ListRestart
              className="h-3.5 w-3.5 text-blue-300"
              aria-hidden="true"
            />
            {selectedChallenge === "AUTO"
              ? "Random Challenge"
              : `Manual ${challengeButtonLabel(selectedChallenge)}`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          <motion.button
            type="button"
            disabled={disabled}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.25,
              ease: "easeOut",
            }}
            onClick={() => onSelect("AUTO")}
            className={`rounded-[1.2rem] border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
              selectedChallenge === "AUTO"
                ? "border-blue-400/24 bg-blue-500/14 text-white shadow-[0_18px_40px_rgba(37,99,235,0.2)]"
                : "border-white/10 bg-white/5 text-white hover:border-blue-400/18 hover:bg-white/8"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-[0.9rem] border sm:h-10 sm:w-10 ${
                selectedChallenge === "AUTO"
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-slate-950/40 text-blue-300"
              }`}
            >
              <ListRestart
                className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] sm:mt-4 sm:text-sm sm:tracking-[0.2em]">
              Auto
            </p>
            <p className="mt-1.5 text-[0.65rem] font-medium leading-4 text-slate-400 sm:mt-2 sm:text-xs sm:leading-5">
              Randomly choose the liveness prompt each time.
            </p>
          </motion.button>

          {LIVENESS_CHALLENGES.map((challenge, index) => {
            const isActive = selectedChallenge === challenge;
            const Icon = CHALLENGE_ICONS[challenge];

            return (
              <motion.button
                key={challenge}
                type="button"
                disabled={disabled}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.25,
                  ease: "easeOut",
                  delay: shouldReduceMotion ? 0 : (index + 1) * 0.03,
                }}
                onClick={() => onSelect(challenge)}
                className={`rounded-[1.2rem] border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
                  isActive
                    ? "border-blue-400/24 bg-blue-500/14 text-white shadow-[0_18px_40px_rgba(37,99,235,0.2)]"
                    : "border-white/10 bg-white/5 text-white hover:border-blue-400/18 hover:bg-white/8"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-[0.9rem] border sm:h-10 sm:w-10 ${
                    isActive
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-slate-950/40 text-blue-300"
                  }`}
                >
                  <Icon
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] sm:mt-4 sm:text-sm sm:tracking-[0.2em]">
                  {challengeButtonLabel(challenge)}
                </p>
                <p className="mt-1.5 text-[0.65rem] font-medium leading-4 text-slate-400 sm:mt-2 sm:text-xs sm:leading-5">
                  {challengeLabel(challenge)}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
