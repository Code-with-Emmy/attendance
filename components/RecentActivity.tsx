"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, CheckCircle2, LogIn, LogOut, Radio } from "lucide-react";
import type { KioskRecentActivityItem } from "@/components/attendance-kiosk-types";

type Props = {
  items: KioskRecentActivityItem[];
  loading?: boolean;
  error?: string;
  queueCount?: number;
};

const STATUS_BADGES = {
  success: "bg-[#E67300]/12 text-[#ffe5c2] ring-1 ring-[#E67300]/18",
  warning: "bg-white/6 text-[#f7e6cf] ring-1 ring-[#d8c6a8]/18",
  error: "bg-red-500/12 text-red-200 ring-1 ring-[#EF4444]/18",
} as const;

const DIRECTION_STYLES = {
  in: {
    bg: "border-[#E67300]/16 bg-[#E67300]/12",
    dot: "bg-[#E67300]",
    text: "text-[#ffe5c2]",
  },
  out: {
    bg: "border-[#d8c6a8]/16 bg-white/6",
    dot: "bg-[#d8c6a8]",
    text: "text-[#f7e6cf]",
  },
} as const;

export function RecentActivity({
  items,
  loading = false,
  error = "",
  queueCount = 0,
}: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside
      initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: "easeOut",
        delay: 0.05,
      }}
      className="kiosk-panel kiosk-glow relative flex min-h-72 flex-col overflow-hidden rounded-[1.25rem] border border-[#d8c6a8]/18 px-3 py-4 sm:min-h-96 sm:px-5 sm:py-5 lg:h-full lg:px-6"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(230,115,0,0.1),transparent_28%)]" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3 sm:gap-4 sm:pb-4">
          <div>
            <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#E67300] sm:text-[0.68rem] sm:tracking-[0.34em]">
              {/* Animated green dot */}
              <span className="relative flex h-2.5 w-2.5">
                {!shouldReduceMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E67300] opacity-40" />
                )}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E67300]" />
              </span>
              <span>Recent Activity</span>
            </div>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:mt-2 sm:text-2xl">
              Live Clock Feed
            </h2>
            <p className="mt-1 max-w-sm text-xs text-[#d8c6a8] sm:mt-2 sm:text-sm">
              Real-time employee verification history for this terminal.
            </p>
          </div>
          <span className="border border-[#E67300]/20 bg-[#E67300]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe5c2]">
            {items.length} entries
          </span>
        </div>

        {/* Stream status bar */}
        <div className="mt-3 flex items-center gap-2 border border-[#d8c6a8]/14 bg-white/5 px-3 py-2 text-xs text-[#f7e6cf] sm:mt-4 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm">
          <div className="flex h-8 w-8 items-center justify-center border border-[#d8c6a8]/14 bg-[#021141] sm:h-10 sm:w-10">
            <Radio className="h-4.5 w-4.5 text-[#E67300]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-white">
              Live update stream active
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-[#d8c6a8]">
              {queueCount > 0
                ? `${queueCount} queued for sync`
                : "Kiosk event queue synced"}
            </p>
          </div>
        </div>

        {/* Activity list */}
        <div className="mt-3 flex-1 overflow-y-auto pr-1 sm:mt-4">
          {loading && items.length === 0 ? (
            <div className="flex h-full min-h-52 flex-col items-center justify-center gap-4 rounded-[1.4rem] border border-dashed border-white/10 bg-white/5 text-sm text-slate-400">
              {!shouldReduceMotion && (
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6]"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              )}
              Loading recent activity...
            </div>
          ) : error ? (
            <div className="flex h-full min-h-52 items-center justify-center rounded-[1.4rem] border border-[#EF4444]/20 bg-red-500/10 px-4 text-center text-sm text-red-200">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-dashed border-white/10 bg-white/5 px-4 text-center text-sm text-slate-400">
              <Activity className="h-8 w-8 text-slate-300" aria-hidden="true" />
              Attendance events will appear here after the first verified scan.
            </div>
          ) : (
            <motion.ul layout className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item, index) => {
                  const ActionIcon = item.direction === "in" ? LogIn : LogOut;
                  const dirStyle = DIRECTION_STYLES[item.direction];

                  return (
                    <motion.li
                      layout
                      key={item.id}
                      initial={
                        shouldReduceMotion
                          ? false
                          : { opacity: 0, x: 28, filter: "blur(8px)" }
                      }
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={
                        shouldReduceMotion
                          ? undefined
                          : { opacity: 0, x: -18, filter: "blur(6px)" }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.28,
                        ease: "easeOut",
                        delay: shouldReduceMotion ? 0 : index * 0.03,
                      }}
                      className="group relative overflow-hidden border border-[#d8c6a8]/14 bg-white/5 px-3 py-3 transition-all duration-200 hover:border-[#E67300]/18 hover:bg-white/8 shadow-[0_18px_40px_rgba(2,17,65,0.18)] sm:px-4 sm:py-4"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,115,0,0.05),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          {/* Avatar with direction indicator */}
                          <div className="relative">
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[#d8c6a8]/14 bg-[#021141] text-xs font-semibold text-white sm:h-11 sm:w-11 sm:text-sm">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.employeeName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                item.avatarLabel
                              )}
                            </div>
                            {/* Tiny direction dot */}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${dirStyle.dot}`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                              {item.employeeName}
                            </p>
                            <p className="mt-1 truncate text-sm text-[#d8c6a8]">
                              {item.department || "Attendance event"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${dirStyle.bg} ${dirStyle.text}`}
                              >
                                <ActionIcon
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                {item.actionLabel}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${STATUS_BADGES[item.status]}`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden shrink-0 text-right sm:block">
                          <div className="inline-flex items-center gap-2 border border-[#d8c6a8]/14 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#d8c6a8]">
                            <CheckCircle2
                              className="h-3.5 w-3.5 text-[#E67300]"
                              aria-hidden="true"
                            />
                            Recorded
                          </div>
                          <p className="mt-3 font-mono text-base font-semibold text-white">
                            {item.timestampLabel}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
