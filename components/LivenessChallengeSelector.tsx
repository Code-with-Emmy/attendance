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
      className="kiosk-panel relative overflow-hidden rounded-[1.25rem] border border-[#d8c6a8]/18 px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Liveness challenge selector"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#E67300] sm:text-[0.68rem] sm:tracking-[0.3em]">
              Liveness Fallback
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Stay on auto, choose manual when needed
            </h2>
            <p className="mt-1.5 text-xs font-medium text-[#d8c6a8] sm:mt-2 sm:text-sm">
              The kiosk starts on Auto. Choose a manual challenge only when you
              want to override the random prompt.
            </p>
          </div>

          <div className="inline-flex max-w-fit items-center gap-2 border border-[#E67300]/24 bg-[#E67300]/10 px-2.5 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#f7e6cf] sm:px-3 sm:py-2 sm:text-[0.66rem] sm:tracking-[0.22em]">
            <ListRestart
              className="h-3.5 w-3.5 text-[#E67300]"
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
            className={`border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
              selectedChallenge === "AUTO"
                ? "border-[#E67300]/32 bg-[#E67300]/14 text-white shadow-[0_18px_40px_rgba(230,115,0,0.14)]"
                : "border-[#d8c6a8]/14 bg-white/5 text-white hover:border-[#E67300]/22 hover:bg-white/8"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center border sm:h-10 sm:w-10 ${
                selectedChallenge === "AUTO"
                  ? "border-[#E67300]/30 bg-[#E67300]/14 text-[#ffd8ae]"
                  : "border-[#d8c6a8]/16 bg-[#021141] text-[#E67300]"
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
            <p className="mt-1.5 text-[0.65rem] font-medium leading-4 text-[#d8c6a8] sm:mt-2 sm:text-xs sm:leading-5">
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
                className={`border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
                  isActive
                    ? "border-[#E67300]/32 bg-[#E67300]/14 text-white shadow-[0_18px_40px_rgba(230,115,0,0.14)]"
                    : "border-[#d8c6a8]/14 bg-white/5 text-white hover:border-[#E67300]/22 hover:bg-white/8"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center border sm:h-10 sm:w-10 ${
                    isActive
                      ? "border-[#E67300]/30 bg-[#E67300]/14 text-[#ffd8ae]"
                      : "border-[#d8c6a8]/16 bg-[#021141] text-[#E67300]"
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
                <p className="mt-1.5 text-[0.65rem] font-medium leading-4 text-[#d8c6a8] sm:mt-2 sm:text-xs sm:leading-5">
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
