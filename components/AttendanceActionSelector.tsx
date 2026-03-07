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
    detail: "Default when nothing is selected",
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
      className="kiosk-panel relative overflow-hidden rounded-[1.8rem] border border-white/10 px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Attendance action selector"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_8%,rgba(59,130,246,0.18)_38%,rgba(34,211,238,0.14)_62%,transparent_92%)]" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-slate-400 sm:text-[0.68rem] sm:tracking-[0.3em]">
              Attendance Action
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Choose an action or leave it on auto
            </h2>
            <p className="mt-1.5 text-xs font-medium text-slate-400 sm:mt-2 sm:text-sm">
              If nothing is selected, the kiosk stays on automatic clock in and
              clock out mode.
            </p>
          </div>

          <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-300 sm:px-3 sm:py-2 sm:text-[0.66rem] sm:tracking-[0.22em]">
            <Coffee className="h-3.5 w-3.5 text-blue-300" aria-hidden="true" />
            {selectedAction === "AUTO"
              ? "Default Auto Mode"
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
                    ? "border-blue-400/24 bg-blue-500/14 text-white shadow-[0_18px_40px_rgba(37,99,235,0.2)]"
                    : "border-white/10 bg-white/5 text-white hover:border-blue-400/18 hover:bg-white/8"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""} rounded-[1.2rem] border px-3 py-3 sm:px-4 sm:py-4`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-[0.9rem] border sm:h-10 sm:w-10 ${
                    isActive
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-slate-950/40 text-blue-300"
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
                    isActive ? "text-blue-100" : "text-slate-400"
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
