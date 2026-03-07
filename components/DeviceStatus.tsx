"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Camera, ShieldCheck, Wifi } from "lucide-react";
import type { KioskDeviceHealth } from "@/components/attendance-kiosk-types";

type Props = {
  cameraReady: boolean;
  cameraError: string;
  networkOnline: boolean;
  secure: boolean;
};

const HEALTH_STYLES: Record<
  KioskDeviceHealth,
  {
    dot: string;
    pill: string;
    label: string;
    glow: string;
  }
> = {
  online: {
    dot: "bg-[#22C55E]",
    pill: "border border-emerald-400/18 bg-emerald-400/10 text-slate-100",
    label: "Online",
    glow: "shadow-[0_18px_40px_rgba(2,6,23,0.28)]",
  },
  degraded: {
    dot: "bg-[#F59E0B]",
    pill: "border border-amber-400/18 bg-amber-400/10 text-slate-100",
    label: "Fallback",
    glow: "shadow-[0_18px_40px_rgba(2,6,23,0.28)]",
  },
  offline: {
    dot: "bg-[#EF4444]",
    pill: "border border-red-400/18 bg-red-500/10 text-slate-100",
    label: "Offline",
    glow: "shadow-[0_18px_40px_rgba(2,6,23,0.28)]",
  },
};

export function DeviceStatus({
  cameraReady,
  cameraError,
  networkOnline,
  secure,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const items = [
    {
      key: "camera",
      label: "Camera",
      value: cameraError
        ? "Preview unavailable"
        : cameraReady
          ? "Connected"
          : "Booting",
      health: cameraError ? "degraded" : cameraReady ? "online" : "degraded",
      Icon: Camera,
    },
    {
      key: "network",
      label: "Network",
      value: networkOnline ? "Synced" : "Offline mode",
      health: networkOnline ? "online" : "offline",
      Icon: Wifi,
    },
    {
      key: "security",
      label: "Security",
      value: secure ? "Secure context" : "Attention required",
      health: secure ? "online" : "offline",
      Icon: ShieldCheck,
    },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      {items.map(({ key, label, value, health, Icon }, index) => {
        const tone = HEALTH_STYLES[health];

        return (
          <motion.div
            key={key}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.35,
              ease: "easeOut",
              delay: shouldReduceMotion ? 0 : index * 0.06,
            }}
            className={`group relative flex min-w-40 items-center gap-3 overflow-hidden rounded-3xl px-3.5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 ${tone.pill} ${tone.glow}`}
          >
            {/* Subtle inner glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.04),transparent_50%)]" />

            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="relative min-w-0">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.28em] text-slate-400">
                {label}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-200">
                {/* Animated pulse dot for online status */}
                <span className="relative flex h-2.5 w-2.5">
                  {health === "online" && !shouldReduceMotion && (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${tone.dot}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone.dot}`}
                  />
                </span>
                <span className="truncate">{value}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
