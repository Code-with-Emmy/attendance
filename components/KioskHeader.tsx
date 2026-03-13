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
      className="kiosk-panel kiosk-glow relative overflow-hidden rounded-[1.25rem] px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4.5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(230,115,0,0.12),transparent_22%),linear-gradient(90deg,rgba(255,255,255,0.02),transparent_50%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />

      <div className="relative flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo
              size="lg"
              className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-[0_14px_28px_rgba(2,6,23,0.5)]"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.34em] text-[#E67300]">
                  AttendanceKiosk
                </p>
                <span
                  className={`inline-flex items-center gap-2 border px-2.5 py-0.75 text-[0.62rem] font-black uppercase tracking-[0.2em] ${
                    kioskOnline
                      ? "border-[#E67300]/30 bg-[#E67300]/12 text-[#ffd8ae]"
                      : "border-[#d8c6a8]/24 bg-white/6 text-[#f7e6cf]"
                  }`}
                >
                  {/* Animated status dot */}
                  <span className="relative flex h-2.5 w-2.5">
                    {!shouldReduceMotion && (
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
                          kioskOnline ? "bg-[#E67300]" : "bg-[#d8c6a8]"
                        }`}
                      />
                    )}
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        kioskOnline ? "bg-[#E67300]" : "bg-[#d8c6a8]"
                      }`}
                    />
                  </span>
                  {kioskOnline ? "Kiosk Online" : "Attention Required"}
                </span>
              </div>

              <h1 className="mt-1.5 text-xl font-black tracking-[0.01em] text-white sm:text-2xl md:text-[2rem]">
                {terminalName}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-bold text-[#d8c6a8]">
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
