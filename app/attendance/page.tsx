"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CameraPanel } from "@/components/camera-panel";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import { challengeLabel, pickRandomChallenge, runLivenessChallenge, type LivenessChallenge } from "@/lib/liveness";
import { BRAND_COMPANY, BRAND_PRODUCT } from "@/lib/branding";

type KioskClockResponse = {
  success: boolean;
  employee: {
    id: string;
    name: string;
    email: string | null;
  };
  entry: {
    id: string;
    type: "CLOCK_IN" | "CLOCK_OUT";
    distance: number;
    timestamp: string;
  };
  threshold: number;
};

export default function AttendanceKioskPage() {
  const { videoRef, ready, error: cameraError, restart } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [challenge, setChallenge] = useState<LivenessChallenge>("BLINK");

  useEffect(() => {
    let mounted = true;

    void loadFaceModels()
      .then(() => {
        if (mounted) setModelsReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setActionError("Failed to load face models from /public/models.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleClock(type: "CLOCK_IN" | "CLOCK_OUT") {
    if (!videoRef.current) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setMessage(`${type === "CLOCK_IN" ? "Clock In" : "Clock Out"} started. ${challengeLabel(challenge)}`);

    try {
      const liveness = await runLivenessChallenge(videoRef.current, challenge);
      if (!liveness.ok) {
        throw new Error(liveness.reason || "Liveness challenge failed.");
      }

      const embedding = await captureSingleFaceEmbedding(videoRef.current);
      const result = await apiFetch<KioskClockResponse>("/api/kiosk/clock", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({ type, embedding }),
      });

      setMessage(
        `${result.employee.name} ${
          result.entry.type === "CLOCK_IN" ? "clocked in" : "clocked out"
        } at ${new Date(result.entry.timestamp).toLocaleString()} (distance ${result.entry.distance.toFixed(4)}).`,
      );
      setChallenge(pickRandomChallenge());
    } catch (err) {
      setActionError(toUserFacingFaceError(err, "Face not recognized. Try again."));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <header className="glass-card reveal mb-6 rounded-[1.8rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
              {BRAND_COMPANY}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ink-strong)] md:text-4xl">{BRAND_PRODUCT} Kiosk</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
              One face in frame, liveness challenge, then the kiosk identifies employee and records attendance.
            </p>
          </div>

          <Link href="/" className="btn-solid btn-neutral">
            Admin Login
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <CameraPanel videoRef={videoRef} ready={ready} error={cameraError} />

        <section className="glass-card reveal rounded-3xl p-5">
          <h2 className="text-xl font-bold text-[var(--ink-strong)]">Attendance Action</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">If liveness fails or face is not recognized, clocking is blocked.</p>

          <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-sm">
            <p className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--ink-strong)]">Model status</span>
              <span className={`status-chip ${modelsReady ? "status-ok" : "status-warn"}`}>{modelsReady ? "Loaded" : "Loading"}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--ink-strong)]">Liveness challenge</span>
              <span className="text-right text-[var(--ink-soft)]">{challengeLabel(challenge)}</span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setChallenge(pickRandomChallenge())} className="btn-solid btn-neutral">
              New Challenge
            </button>
            <button type="button" onClick={restart} className="btn-solid btn-neutral">
              Restart Camera
            </button>
            <button
              type="button"
              onClick={() => void handleClock("CLOCK_IN")}
              disabled={actionLoading || !ready || !modelsReady}
              className="btn-solid btn-emerald"
            >
              {actionLoading ? "Processing..." : "Clock In"}
            </button>
            <button
              type="button"
              onClick={() => void handleClock("CLOCK_OUT")}
              disabled={actionLoading || !ready || !modelsReady}
              className="btn-solid btn-warn"
            >
              {actionLoading ? "Processing..." : "Clock Out"}
            </button>
          </div>

          {actionError && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>}
          {message && <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        </section>
      </div>
    </main>
  );
}
