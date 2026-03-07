"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import type {
  KioskClockResponse,
  KioskStatus,
} from "@/components/attendance-kiosk-types";

const SCANNING_STATUS: KioskStatus = {
  tone: "scanning",
  title: "Align your face with the camera",
  detail: "Look at the camera to clock in or out.",
};

type Props = {
  onClockResolved: (result: KioskClockResponse) => void;
  onStatusChange: (status: KioskStatus) => void;
};

type ScannerMode = "warming" | "scanning" | "processing" | "error";

function mapClockResponseToStatus(result: KioskClockResponse): KioskStatus {
  if (result.entry.isWarning || result.alreadyDone) {
    const warningMessage = result.entry.message ?? "Already clocked in today.";

    return {
      tone: "warning",
      title: warningMessage.toLowerCase().includes("already")
        ? "Already Clocked In Today"
        : "Attendance Requires Review",
      detail: warningMessage,
    };
  }

  if (result.entry.type === "CLOCK_OUT") {
    return {
      tone: "success",
      title: "\u2713 Clock Out Successful",
      detail: `Goodbye ${result.employee.name}`,
    };
  }

  return {
    tone: "success",
    title: "\u2713 Clock In Successful",
    detail: `Welcome ${result.employee.name}`,
  };
}

export function FaceScanner({ onClockResolved, onStatusChange }: Props) {
  const { videoRef, ready, error: cameraError, restart } = useCamera();
  const [modelsReady, setModelsReady] = useState(false);
  const [mode, setMode] = useState<ScannerMode>("warming");
  const [overlayLabel, setOverlayLabel] = useState("Initializing scanner");
  const [feedbackPulse, setFeedbackPulse] = useState<"success" | "error" | "warning" | null>(null);
  const processingRef = useRef(false);
  const requireClearFrameRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const effectiveMode: ScannerMode = cameraError ? "error" : mode;
  const effectiveOverlayLabel = cameraError
    ? "Camera unavailable"
    : !modelsReady
      ? "Loading biometric engine"
      : !ready
        ? "Starting camera feed"
        : overlayLabel;
  const effectiveFeedbackPulse = cameraError ? "error" : feedbackPulse;

  const playFeedback = useEffectEvent((tone: "success" | "error" | "warning") => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      void context.resume();
    }

    const pattern =
      tone === "success"
        ? [
            { frequency: 880, at: 0, duration: 0.08 },
            { frequency: 1174, at: 0.11, duration: 0.1 },
          ]
        : tone === "warning"
          ? [
              { frequency: 540, at: 0, duration: 0.1 },
              { frequency: 540, at: 0.14, duration: 0.1 },
            ]
          : [
              { frequency: 220, at: 0, duration: 0.12 },
              { frequency: 180, at: 0.14, duration: 0.18 },
            ];

    for (const note of pattern) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone === "error" ? "triangle" : "sine";
      oscillator.frequency.value = note.frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + note.at);
      gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + note.at + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + note.at + note.duration,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + note.at);
      oscillator.stop(context.currentTime + note.at + note.duration);
    }
  });

  const queueReset = useEffectEvent(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      processingRef.current = false;
      setMode("scanning");
      setOverlayLabel("Scanning for faces");
      setFeedbackPulse(null);
      onStatusChange(SCANNING_STATUS);
    }, 3000);
  });

  const sendClockAttempt = useEffectEvent(
    async (embedding: number[], type: "CLOCK_IN" | "CLOCK_OUT", attemptId: string) =>
      apiFetch<KioskClockResponse>("/api/kiosk/clock", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          type,
          embedding,
          idempotencyKey: `${attemptId}:${type.toLowerCase()}`,
          timestamp: new Date().toISOString(),
        }),
      }),
  );

  const resolveAttendance = useEffectEvent(async (embedding: number[]) => {
    const attemptId = crypto.randomUUID();
    const firstAttempt = await sendClockAttempt(embedding, "CLOCK_IN", attemptId);

    if (
      firstAttempt.entry.isWarning &&
      firstAttempt.entry.message?.toLowerCase().includes("already clocked in")
    ) {
      return sendClockAttempt(embedding, "CLOCK_OUT", attemptId);
    }

    return firstAttempt;
  });

  const failScan = useEffectEvent((message: string) => {
    processingRef.current = true;
    requireClearFrameRef.current = true;
    setMode("error");
    setOverlayLabel("Identity rejected");
    setFeedbackPulse("error");
    onStatusChange({
      tone: "error",
      title: "\u2715 Face Not Recognized",
      detail: message.includes("administrator")
        ? message
        : `${message} Please contact your administrator if this continues.`,
    });
    playFeedback("error");
    queueReset();
  });

  const runScan = useEffectEvent(async () => {
    if (!videoRef.current || !ready || !modelsReady || processingRef.current) {
      return;
    }

    try {
      const embedding = await captureSingleFaceEmbedding(videoRef.current);

      if (requireClearFrameRef.current) {
        return;
      }

      processingRef.current = true;
      setMode("processing");
      setOverlayLabel("Verifying identity");
      onStatusChange({
        tone: "scanning",
        title: "Biometric verification in progress",
        detail: "Stay centered while AttendanceKiosk validates your face.",
      });

      const result = await resolveAttendance(embedding);
      const nextStatus = mapClockResponseToStatus(result);
      const feedbackTone =
        nextStatus.tone === "success" || nextStatus.tone === "warning" || nextStatus.tone === "error"
          ? nextStatus.tone
          : null;

      requireClearFrameRef.current = true;
      setMode("scanning");
      setOverlayLabel("Scan complete");
      setFeedbackPulse(feedbackTone);
      onClockResolved(result);
      onStatusChange(nextStatus);
      if (feedbackTone) {
        playFeedback(feedbackTone);
      }
      queueReset();
    } catch (error) {
      const message = toUserFacingFaceError(error, "Face not recognized.");

      if (message.toLowerCase().startsWith("no face detected")) {
        if (requireClearFrameRef.current) {
          requireClearFrameRef.current = false;
        }
        if (!processingRef.current) {
          setMode(modelsReady && ready ? "scanning" : "warming");
          setOverlayLabel(modelsReady && ready ? "Scanning for faces" : "Initializing scanner");
        }
        return;
      }

      failScan(message);
    }
  });

  useEffect(() => {
    let active = true;

    void loadFaceModels()
      .then(() => {
        if (!active) {
          return;
        }
        setModelsReady(true);
        setMode(ready ? "scanning" : "warming");
        setOverlayLabel(ready ? "Scanning for faces" : "Initializing scanner");
      })
      .catch((error) => {
        console.error(error);
        if (!active) {
          return;
        }
        processingRef.current = true;
        setMode("error");
        setOverlayLabel("Biometric engine failed");
        setFeedbackPulse("error");
        onStatusChange({
          tone: "error",
          title: "Scanner Unavailable",
          detail: "Face recognition models could not be loaded on this device.",
        });
      });

    return () => {
      active = false;
    };
  }, [onStatusChange, ready]);

  useEffect(() => {
    if (!modelsReady) {
      return;
    }

    if (cameraError) {
      processingRef.current = true;
      onStatusChange({
        tone: "error",
        title: "Camera Unavailable",
        detail: cameraError,
      });
      return;
    }

    if (ready && !processingRef.current) {
      onStatusChange(SCANNING_STATUS);
    }
  }, [cameraError, modelsReady, onStatusChange, ready]);

  useEffect(() => {
    const resumeAudio = () => {
      if (audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume();
      }
    };

    window.addEventListener("pointerdown", resumeAudio);
    return () => window.removeEventListener("pointerdown", resumeAudio);
  }, []);

  useEffect(() => {
    if (!ready || !modelsReady || cameraError) {
      return;
    }

    const interval = window.setInterval(() => {
      void runScan();
    }, 1600);

    return () => window.clearInterval(interval);
  }, [cameraError, modelsReady, ready]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const scannerGlowClass =
    effectiveFeedbackPulse === "success"
      ? "ring-emerald-400/35 shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_0_70px_rgba(34,197,94,0.2)]"
      : effectiveFeedbackPulse === "error"
        ? "ring-rose-400/35 shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_0_70px_rgba(239,68,68,0.16)]"
        : effectiveFeedbackPulse === "warning"
          ? "ring-amber-400/35 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_70px_rgba(251,191,36,0.16)]"
          : "ring-blue-400/25 shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_0_60px_rgba(59,130,246,0.12)]";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="kiosk-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_100%_10%,rgba(14,165,233,0.1),transparent_26%)]" />

      <div className="relative flex items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.38em] text-slate-400">
            Biometric Scanner
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            Facial Recognition Terminal
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-200">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                effectiveMode === "error"
                  ? "bg-rose-300"
                  : effectiveMode === "processing"
                    ? "bg-blue-300"
                    : "bg-emerald-300"
              } kiosk-orb`}
            />
            {effectiveOverlayLabel}
          </span>

          <button
            type="button"
            onClick={() => void restart()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>

      <motion.div
        animate={{
          boxShadow:
            effectiveMode === "processing"
              ? "0 0 0 1px rgba(59,130,246,0.24), 0 0 72px rgba(59,130,246,0.22)"
              : undefined,
        }}
        transition={{ duration: 0.35 }}
        className={`relative mt-6 overflow-hidden rounded-[1.9rem] border border-[#1E293B] bg-[#020617] ring-1 ${scannerGlowClass}`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,0.56))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.12),transparent_28%)]" />

        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="aspect-[4/3] min-h-[24rem] w-full object-cover scale-x-[-1] md:min-h-[33rem]"
        />

        <motion.div
          animate={{ opacity: effectiveMode === "processing" ? 1 : 0.7 }}
          className="pointer-events-none absolute inset-[10%] rounded-[2rem] border border-white/8"
        />

        <div className="pointer-events-none absolute inset-[15%]">
          {[
            "left-0 top-0 rounded-tl-[1.35rem] border-l-[5px] border-t-[5px]",
            "right-0 top-0 rounded-tr-[1.35rem] border-r-[5px] border-t-[5px]",
            "left-0 bottom-0 rounded-bl-[1.35rem] border-l-[5px] border-b-[5px]",
            "right-0 bottom-0 rounded-br-[1.35rem] border-r-[5px] border-b-[5px]",
          ].map((position, index) => (
            <motion.div
              key={position}
              className={`absolute h-16 w-16 border-blue-400 ${position}`}
              animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.04, 1] }}
              transition={{
                duration: 2.8,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.12,
              }}
            />
          ))}

          <motion.div
            className="absolute inset-x-12 top-1/2 h-px bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_24px_rgba(59,130,246,0.8)]"
            animate={{ y: ["-8rem", "8rem", "-8rem"], opacity: [0, 1, 0] }}
            transition={{ duration: 3.4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={false}
            animate={{ opacity: effectiveMode === "processing" ? 0.14 : 0.22 }}
            className="rounded-full border border-blue-300/30 bg-slate-950/40 px-6 py-3 backdrop-blur-md"
          >
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-100">
              Align your face with the camera
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="relative mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.36em] text-slate-400">
            Attendance Guidance
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            Look at the camera to clock in or out
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 kiosk-orb" />
          Touchless operation enabled
        </div>
      </div>

      <AnimatePresence>
        {effectiveFeedbackPulse && (
          <motion.div
            key={effectiveFeedbackPulse}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`pointer-events-none absolute inset-0 rounded-[2rem] ${
              effectiveFeedbackPulse === "success"
                ? "bg-emerald-400/5"
                : effectiveFeedbackPulse === "warning"
                  ? "bg-amber-400/5"
                  : "bg-rose-400/5"
            }`}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
