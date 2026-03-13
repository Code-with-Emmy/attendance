"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Coffee, LogIn, LogOut, Play, Pause } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { KioskRequestedAction } from "@/components/attendance-kiosk-types";

type Props = {
  selectedAction: KioskRequestedAction;
  onSelect: (action: KioskRequestedAction) => void;
  disabled?: boolean;
};

const ACTION_OPTIONS: Array<{
  value: KioskRequestedAction;
  label: string;
  detail: string;
  Icon: LucideIcon;
}> = [
  {
    value: "AUTO",
    label: "Auto",
    detail: "Let the kiosk decide the action",
    Icon: Bot,
  },
  {
    value: "CLOCK_IN",
    label: "Clock In",
    detail: "Start the work session",
    Icon: LogIn,
  },
  {
    value: "CLOCK_OUT",
    label: "Clock Out",
    detail: "End the work session",
    Icon: LogOut,
  },
  {
    value: "BREAK_START",
    label: "Break Start",
    detail: "Pause active work",
    Icon: Pause,
  },
  {
    value: "BREAK_END",
    label: "Break End",
    detail: "Resume from break",
    Icon: Play,
  },
];

export function AttendanceActionSelector({
  selectedAction,
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
      aria-label="Attendance action selector"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#E67300] sm:text-[0.68rem] sm:tracking-[0.3em]">
              Attendance Action
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Stay on auto, choose manual when needed
            </h2>
            <p className="mt-1.5 text-xs font-medium text-[#d8c6a8] sm:mt-2 sm:text-sm">
              The kiosk starts on Auto. Choose any manual attendance action when
              you want to override the automatic flow.
            </p>
          </div>

          <div className="inline-flex max-w-fit items-center gap-2 border border-[#E67300]/24 bg-[#E67300]/10 px-2.5 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#f7e6cf] sm:px-3 sm:py-2 sm:text-[0.66rem] sm:tracking-[0.22em]">
            <Coffee className="h-3.5 w-3.5 text-[#E67300]" aria-hidden="true" />
            {selectedAction === "AUTO"
              ? "Auto Mode Selected"
              : "Manual Action Selected"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          {ACTION_OPTIONS.map((option, index) => {
            const isActive = selectedAction === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                disabled={disabled}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.25,
                  ease: "easeOut",
                  delay: shouldReduceMotion ? 0 : index * 0.03,
                }}
                onClick={() => onSelect(option.value)}
                className={`text-left transition ${
                  isActive
                    ? "border-[#E67300]/32 bg-[#E67300]/14 text-white shadow-[0_18px_40px_rgba(230,115,0,0.14)]"
                    : "border-[#d8c6a8]/14 bg-white/5 text-white hover:border-[#E67300]/22 hover:bg-white/8"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""} border px-3 py-3 sm:px-4 sm:py-4`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center border sm:h-10 sm:w-10 ${
                    isActive
                      ? "border-[#E67300]/30 bg-[#E67300]/14 text-[#ffd8ae]"
                      : "border-[#d8c6a8]/16 bg-[#021141] text-[#E67300]"
                  }`}
                >
                  <option.Icon
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                    aria-hidden="true"
                  />
                </div>
                <p
                  className={`mt-3 text-xs font-black uppercase tracking-[0.15em] sm:mt-4 sm:text-sm sm:tracking-[0.2em] ${
                    isActive ? "text-white" : "text-white"
                  }`}
                >
                  {option.label}
                </p>
                <p
                  className={`mt-1.5 text-[0.65rem] font-medium leading-4 sm:mt-2 sm:text-xs sm:leading-5 ${
                    isActive ? "text-[#ffe5c2]" : "text-[#d8c6a8]"
                  }`}
                >
                  {option.detail}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
