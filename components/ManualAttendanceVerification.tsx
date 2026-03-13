"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ClipboardCheck, UserRoundSearch } from "lucide-react";
import type { KioskRequestedAction } from "@/components/attendance-kiosk-types";

type ManualAttendanceForm = {
  fullName: string;
  workEmail: string;
  reason: string;
};

type Props = {
  open: boolean;
  disabled?: boolean;
  submitting?: boolean;
  selectedAction: KioskRequestedAction;
  error: string;
  form: ManualAttendanceForm;
  onToggle: () => void;
  onChange: <K extends keyof ManualAttendanceForm>(
    key: K,
    value: ManualAttendanceForm[K],
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ManualAttendanceVerification({
  open,
  disabled = false,
  submitting = false,
  selectedAction,
  error,
  form,
  onToggle,
  onChange,
  onSubmit,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const actionSelected = selectedAction !== "AUTO";

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
      className="kiosk-panel relative overflow-hidden rounded-[1.25rem] border border-[#d8c6a8]/18 px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Manual attendance verification"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#E67300] sm:text-[0.68rem] sm:tracking-[0.3em]">
              Manual Review Fallback
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:mt-2 sm:text-2xl">
              Use manual verification only when face scan fails
            </h2>
            <p className="mt-1.5 text-xs font-medium text-[#d8c6a8] sm:mt-2 sm:text-sm">
              This records attendance with an admin review flag. Enter the employee&apos;s exact full name, work email, and the reason biometric verification failed.
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={onToggle}
            className={`inline-flex items-center gap-2 border px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition ${
              open
                ? "border-[#E67300]/28 bg-[#E67300]/14 text-white"
                : "border-[#d8c6a8]/16 bg-white/5 text-[#f7e6cf]"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {open ? (
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <UserRoundSearch className="h-4 w-4" aria-hidden="true" />
            )}
            {open ? "Close Manual Review" : "Open Manual Review"}
          </button>
        </div>

        {open ? (
          <form onSubmit={onSubmit} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#E67300]">
                Employee Full Name
              </span>
              <input
                value={form.fullName}
                onChange={(event) => onChange("fullName", event.target.value)}
                placeholder="Enter exact employee name"
                disabled={disabled || submitting}
                className="w-full border border-[#d8c6a8]/14 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#E67300]/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#E67300]">
                Work Email
              </span>
              <input
                type="email"
                value={form.workEmail}
                onChange={(event) => onChange("workEmail", event.target.value)}
                placeholder="employee@company.com"
                disabled={disabled || submitting}
                className="w-full border border-[#d8c6a8]/14 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#E67300]/30"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#E67300]">
                Why face verification failed
              </span>
              <textarea
                value={form.reason}
                onChange={(event) => onChange("reason", event.target.value)}
                placeholder="Example: low light, camera reflection, or repeated recognition failure"
                disabled={disabled || submitting}
                rows={3}
                className="w-full border border-[#d8c6a8]/14 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#E67300]/30"
              />
            </label>

            <div className="border-l-4 border-[#E67300] bg-white/5 px-4 py-3 text-sm text-[#f7e6cf] lg:col-span-2">
              {actionSelected
                ? `Manual review will record ${selectedAction.replace("_", " ").toLowerCase()} and flag it for admin review.`
                : "Choose a manual attendance action above before submitting this fallback."}
            </div>

            {error ? (
              <div className="border border-[#E67300]/18 bg-[#E67300]/10 px-4 py-3 text-sm text-[#ffe5c2] lg:col-span-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            ) : null}

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={disabled || submitting || !actionSelected}
                className="inline-flex items-center gap-2 border border-[#E67300]/28 bg-[#E67300] px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#ff8a1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                {submitting ? "Recording Manual Review..." : "Record Manual Verification"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </motion.section>
  );
}
