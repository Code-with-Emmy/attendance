"use client";

import type { RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CameraOff, MonitorSmartphone, ScanFace, Sparkles } from "lucide-react";

type ScannerPhase =
  | "warming"
  | "idle"
  | "liveness"
  | "processing"
  | "success"
  | "warning"
  | "error";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraReady: boolean;
  cameraError: string;
  phase: ScannerPhase;
  overlayMessage: string;
};

const LANDMARKS = [
  "left-[38%] top-[37%]",
  "left-[58%] top-[37%]",
  "left-[48%] top-[49%]",
  "left-[42%] top-[59%]",
  "left-[54%] top-[59%]",
];

const CORNERS = [
  {
    pos: "left-[17%] top-[15%]",
    borders: "border-l-2 border-t-2",
    roundedCorner: "",
  },
  {
    pos: "right-[17%] top-[15%]",
    borders: "border-r-2 border-t-2",
    roundedCorner: "",
  },
  {
    pos: "left-[17%] bottom-[15%]",
    borders: "border-l-2 border-b-2",
    roundedCorner: "",
  },
  {
    pos: "right-[17%] bottom-[15%]",
    borders: "border-r-2 border-b-2",
    roundedCorner: "",
  },
];

function phaseLabel(phase: ScannerPhase) {
  switch (phase) {
    case "warming":
      return "Sensor Warmup";
    case "liveness":
      return "Liveness Active";
    case "processing":
      return "Face Match Pending";
    case "success":
      return "Identity Verified";
    case "warning":
      return "Review Required";
    case "error":
      return "Verification Blocked";
    default:
      return "Ready to Scan";
  }
}

function phaseGlow(phase: ScannerPhase) {
  switch (phase) {
    case "success":
      return "shadow-[0_20px_48px_rgba(2,17,65,0.18),0_0_36px_rgba(230,115,0,0.12)]";
    case "warning":
      return "shadow-[0_20px_48px_rgba(2,17,65,0.18),0_0_36px_rgba(216,198,168,0.1)]";
    case "error":
      return "shadow-[0_20px_48px_rgba(15,23,42,0.08),0_0_36px_rgba(239,68,68,0.10)]";
    case "liveness":
    case "processing":
      return "shadow-[0_20px_48px_rgba(2,17,65,0.18),0_0_36px_rgba(230,115,0,0.12)]";
    default:
      return "shadow-[0_20px_48px_rgba(2,17,65,0.18),0_0_28px_rgba(230,115,0,0.08)]";
  }
}

function phaseBorderColor(phase: ScannerPhase) {
  switch (phase) {
    case "success":
      return "border-[#E67300]/20";
    case "warning":
      return "border-[#F59E0B]/20";
    case "error":
      return "border-[#EF4444]/20";
    case "liveness":
    case "processing":
      return "border-[#E67300]/20";
    default:
      return "border-[#d8c6a8]/16";
  }
}

export function ScannerFrame({
  videoRef,
  cameraReady,
  cameraError,
  phase,
  overlayMessage,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const livePreviewVisible = cameraReady && !cameraError;
  const scanningActive = !cameraError && phase !== "error";
  const showLine = scanningActive && phase !== "success" && phase !== "warning";

  const cornerColor =
    phase === "success"
      ? "border-[#22C55E]"
      : phase === "warning"
        ? "border-[#F59E0B]"
        : phase === "error"
          ? "border-[#EF4444]"
          : "border-[#22D3EE]";

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
      className={`kiosk-panel relative overflow-hidden rounded-[1.25rem] ${phaseBorderColor(phase)} border p-3 transition-shadow duration-700 sm:p-4 lg:p-5 ${phaseGlow(phase)}`}
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#E67300]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(230,115,0,0.12),transparent_24%),linear-gradient(180deg,rgba(2,17,65,0.18),transparent_30%)]" />

      <div
        className={`relative overflow-hidden ${phaseBorderColor(phase)} border bg-[linear-gradient(180deg,rgba(2,17,65,0.96),rgba(7,24,75,0.86))] transition-all duration-500`}
      >
        <div className="relative z-20 flex items-center justify-between border-b border-white/8 bg-slate-950/36 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#E67300]/18 bg-[#E67300]/12 text-[#ffd8ae] shadow-[0_10px_24px_rgba(230,115,0,0.10)] sm:h-11 sm:w-11">
              <ScanFace className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#E67300] sm:text-[0.7rem] sm:tracking-[0.34em]">
                Biometric Verification
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white sm:mt-1 sm:text-base">
                {phaseLabel(phase)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Phase indicator badge */}
            <div className="hidden items-center gap-2 border border-[#d8c6a8]/14 bg-white/5 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#f7e6cf] sm:flex sm:px-3 sm:py-1.5 sm:text-[0.68rem] sm:tracking-[0.28em]">
              <span
                className={`h-2.5 w-2.5 rounded-full ${cameraError ? "bg-[#d8c6a8]" : "bg-[#E67300]"}`}
              />
              {cameraError ? "Fallback UI" : "Secure Feed"}
            </div>
          </div>
        </div>

        <div className="relative aspect-4/3 min-h-14 overflow-hidden bg-[#020617] sm:aspect-16/10 sm:min-h-18 md:aspect-video md:min-h-20">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-all duration-500 ${
              livePreviewVisible
                ? "opacity-100 saturate-[0.88] contrast-[1.06] brightness-[0.9]"
                : "opacity-0"
            }`}
          />

          {/* Camera overlay gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(230,115,0,0.14),transparent_28%),radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,rgba(2,17,65,0.08),rgba(2,17,65,0.34))]" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/8" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_0_120px_rgba(2,6,23,0.45)]" />

          {/* Camera fallback placeholder */}
          {!livePreviewVisible ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {/* Decorative rings */}
              <div className="relative">
                {!shouldReduceMotion && (
                  <>
                    <motion.div
                      className="absolute -inset-8 rounded-full border border-[#3B82F6]/10"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                    <motion.div
                      className="absolute -inset-16 rounded-full border border-[#22D3EE]/8"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.05, 0.2],
                      }}
                      transition={{
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                        delay: 0.5,
                      }}
                    />
                  </>
                )}
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.4rem] border border-white/10 bg-slate-950/56 shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                  <div className="relative flex items-center justify-center">
                    <MonitorSmartphone
                      className="h-10 w-10 text-slate-300"
                      aria-hidden="true"
                    />
                    <CameraOff
                      className="absolute -right-4 -top-4 h-7 w-7 text-[#F59E0B]"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                Camera preview unavailable
              </h3>
              <p className="mt-3 max-w-md text-base text-slate-400">
                Webcam not detected or permission denied. AttendanceKiosk keeps
                the kiosk layout active while the device connection is restored.
              </p>
            </div>
          ) : null}

          {/* Face region boundary */}
          <div className="absolute inset-x-[15%] top-[11%] bottom-[11%] border border-[#d8c6a8]/18 bg-[radial-gradient(circle_at_center,rgba(230,115,0,0.08),transparent_52%)] shadow-[inset_0_0_0_1px_rgba(230,115,0,0.06),0_0_40px_rgba(230,115,0,0.08)]" />

          {/* Center pulse ring */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E67300]/20 bg-[radial-gradient(circle,rgba(230,115,0,0.16),rgba(230,115,0,0.03)_42%,transparent_72%)] sm:h-56 sm:w-56 md:h-72 md:w-72"
            animate={
              shouldReduceMotion || !scanningActive
                ? undefined
                : {
                    scale: [1, 1.04, 1],
                    opacity: [0.4, 0.78, 0.4],
                  }
            }
            transition={
              shouldReduceMotion || !scanningActive
                ? undefined
                : {
                    duration: 2.4,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                  }
            }
          />

          {/* Secondary outer pulse ring */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8c6a8]/10 sm:h-68 sm:w-68 md:h-88 md:w-88"
            animate={
              shouldReduceMotion || !scanningActive
                ? undefined
                : {
                    scale: [1, 1.06, 1],
                    opacity: [0.15, 0.35, 0.15],
                  }
            }
            transition={
              shouldReduceMotion || !scanningActive
                ? undefined
                : {
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.3,
                  }
            }
          />

          {/* Scan line */}
          {showLine ? (
            <motion.div
              className="absolute left-[17%] right-[17%] h-[2px] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.94),transparent)] shadow-[0_0_24px_rgba(34,211,238,0.55),0_0_8px_rgba(34,211,238,0.34)]"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      top: ["24%", "72%", "24%"],
                      opacity: [0.2, 1, 0.2],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 3.4,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }
              }
            />
          ) : null}

          {/* Light sweep effect */}
          {!shouldReduceMotion && scanningActive ? (
            <motion.div
              className="absolute inset-y-0 left-[-24%] w-[34%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)] blur-2xl"
              animate={{ x: ["0%", "360%"] }}
              transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          ) : null}

          {/* Corner brackets */}
          {CORNERS.map((corner) => (
            <motion.div
              key={corner.pos}
              className={`absolute h-9 w-9 sm:h-11 sm:w-11 md:h-14 md:w-14 ${corner.roundedCorner} ${corner.borders} ${cornerColor} ${corner.pos}`}
              animate={
                shouldReduceMotion || !scanningActive
                  ? undefined
                  : {
                      opacity: [0.4, 1, 0.4],
                      scale: [1, 1.05, 1],
                    }
              }
              transition={
                shouldReduceMotion || !scanningActive
                  ? undefined
                  : {
                      duration: 2.4,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }
              }
            />
          ))}

          {/* Facial landmark hint dots */}
          {LANDMARKS.map((point, index) => (
            <motion.div
              key={point}
              className={`absolute h-2 w-2 rounded-full border border-[#22D3EE]/40 bg-cyan-300 ${point}`}
              animate={
                shouldReduceMotion || !scanningActive
                  ? undefined
                  : { opacity: [0.3, 0.7, 0.3] }
              }
              transition={
                shouldReduceMotion || !scanningActive
                  ? undefined
                  : {
                      duration: 2,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.08,
                    }
              }
            />
          ))}
        </div>

        <div className="relative z-20 flex flex-col gap-3 border-t border-white/8 bg-[linear-gradient(180deg,rgba(2,6,23,0.26),rgba(15,23,42,0.42))] px-3 pb-4 pt-3 sm:gap-4 sm:px-6 sm:pb-6 sm:pt-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
              Face Target Zone
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:mt-2 sm:text-2xl md:text-3xl">
              Align your face within the frame
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs text-slate-500 sm:mt-2 sm:text-sm md:text-base">
              {overlayMessage}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 shadow-[0_12px_30px_rgba(2,6,23,0.22)]">
            <Sparkles className="h-4.5 w-4.5 text-blue-300" aria-hidden="true" />
            <span>Auto-start scanning enabled</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
