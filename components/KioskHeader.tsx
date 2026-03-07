"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/brand-logo";
import { DigitalClock } from "@/components/DigitalClock";
import { DeviceStatus } from "@/components/DeviceStatus";
import { RouteNavigator } from "@/components/RouteNavigator";

type Props = {
  companyName: string;
  terminalName: string;
  cameraReady: boolean;
  cameraError: string;
  networkOnline: boolean;
  secure: boolean;
};

export function KioskHeader({
  companyName,
  terminalName,
  cameraReady,
  cameraError,
  networkOnline,
  secure,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const kioskOnline = !cameraError && networkOnline && secure;

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
      className="kiosk-panel kiosk-glow relative overflow-hidden rounded-[2rem] px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4.5"
    >
      {/* Multi-layer ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_right,rgba(34,211,238,0.06),transparent_20%)]" />
      {/* Top edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_5%,rgba(59,130,246,0.24)_30%,rgba(34,211,238,0.18)_60%,transparent_95%)]" />

      <div className="relative flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo
              size="lg"
              className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-[0_14px_28px_rgba(2,6,23,0.5)]"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.34em] text-slate-400">
                  AttendanceKiosk
                </p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.75 text-[0.62rem] font-black uppercase tracking-[0.2em] ${
                    kioskOnline
                      ? "border border-emerald-400/18 bg-emerald-400/10 text-emerald-200"
                      : "border border-amber-400/18 bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {/* Animated status dot */}
                  <span className="relative flex h-2.5 w-2.5">
                    {!shouldReduceMotion && (
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
                          kioskOnline ? "bg-[#22C55E]" : "bg-[#F59E0B]"
                        }`}
                      />
                    )}
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        kioskOnline ? "bg-[#22C55E]" : "bg-[#F59E0B]"
                      }`}
                    />
                  </span>
                  {kioskOnline ? "Kiosk Online" : "Attention Required"}
                </span>
              </div>

              <h1 className="mt-1.5 text-xl font-black tracking-tighter text-white sm:text-2xl md:text-[2rem]">
                {terminalName}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-bold text-slate-400">
                {companyName}
              </p>
            </div>
          </div>

          <div className="xl:hidden">
            <DeviceStatus
              cameraReady={cameraReady}
              cameraError={cameraError}
              networkOnline={networkOnline}
              secure={secure}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 xl:min-w-md">
          <DigitalClock className="px-4 py-3" />
          <RouteNavigator compact />
          <div className="hidden xl:block">
            <DeviceStatus
              cameraReady={cameraReady}
              cameraError={cameraError}
              networkOnline={networkOnline}
              secure={secure}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
