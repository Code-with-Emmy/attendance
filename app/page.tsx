"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import {
  challengeLabel,
  pickRandomChallenge,
  runLivenessChallenge,
  type LivenessChallenge,
} from "@/lib/liveness";
import { BRAND_COMPANY, BRAND_PRODUCT } from "@/lib/branding";
import { BrandLoader } from "@/components/brand-loader";

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

type KioskHistoryItem = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT";
  timestamp: string;
  employee: {
    name: string;
  };
};

function KioskClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-4xl md:text-6xl font-black tracking-tighter text-(--ink-strong) leading-none">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <div className="flex items-center gap-3">
        <span className="h-1 w-12 bg-cyan-600 rounded-sm" />
        <p className="text-sm font-black uppercase tracking-widest text-(--ink-soft) opacity-60">
          {time.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

export default function PlainKioskPage() {
  const { videoRef, ready, error: cameraError, restart } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [challenge, setChallenge] = useState<LivenessChallenge>("BLINK");
  const [lastUser, setLastUser] = useState<{
    name: string;
    type: string;
    isWarning?: boolean;
    message?: string;
  } | null>(null);

  const [history, setHistory] = useState<KioskHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiFetch<KioskHistoryItem[]>("/api/kiosk/history", {
        requireAuth: false,
      });
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadFaceModels()
      .then(() => {
        if (mounted) setModelsReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setActionError("Camera error. Please refresh.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleClock(type: "CLOCK_IN" | "CLOCK_OUT") {
    if (!videoRef.current) return;

    setActionLoading(true);
    setActionError("");
    setLastUser(null);
    setMessage(`Please ${challengeLabel(challenge)}`);

    try {
      const liveness = await runLivenessChallenge(videoRef.current, challenge);
      if (!liveness.ok) {
        throw new Error(liveness.reason || "Action not recognized.");
      }

      const embedding = await captureSingleFaceEmbedding(videoRef.current);
      const result = await apiFetch<KioskClockResponse>("/api/kiosk/clock", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({ type, embedding }),
      });

      setLastUser({
        name: result.employee.name,
        type: result.entry.type,
        isWarning: (result.entry as any).isWarning,
        message: (result.entry as any).message,
      });
      setMessage("");
      setChallenge(pickRandomChallenge());
      void fetchHistory();

      setTimeout(() => {
        setLastUser(null);
      }, 5000);
    } catch (err) {
      const errMsg = toUserFacingFaceError(err, "Face not found.");
      setActionError(errMsg);
      setTimeout(() => setActionError(""), 4000);
    } finally {
      setActionLoading(false);
    }
  }

  const toggleChallenge = () => {
    setChallenge(pickRandomChallenge());
    setMessage("Verification updated");
    setTimeout(() => setMessage(""), 2000);
  };

  if (!modelsReady) {
    return <BrandLoader label="Opening kiosk system..." />;
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 font-(family-name:--font-lato) antialiased text-(--ink-strong) overflow-y-auto">
      {/* Scrollable Container */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        {/* Simple Top Header */}
        <header className="flex w-full items-center justify-between mb-16 border-b border-slate-200 pb-10">
          <KioskClock />

          <div className="flex items-center gap-6">
            <div className="hidden flex-col items-end sm:flex">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 mb-1">
                {BRAND_COMPANY}
              </p>
              <p className="text-xl font-black text-(--ink-strong) tracking-tighter">
                {BRAND_PRODUCT}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-3 border-slate-200 border-t-blue-500 animate-spin opacity-30" />
            </div>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Hub: Interactions */}
          <div className="lg:col-span-12 space-y-12">
            {/* Interaction Buttons - Clear & Rectangular */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => void handleClock("CLOCK_IN")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-blue-700 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-blue-600 text-white`}
              >
                <span className="text-4xl font-black tracking-tighter">
                  I'M STARTING
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                  Clock in for shift
                </span>
              </button>

              <button
                onClick={() => void handleClock("CLOCK_OUT")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-amber-600 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-amber-500 text-white`}
              >
                <span className="text-4xl font-black tracking-tighter">
                  I'M FINISHED
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                  Clock out for shift
                </span>
              </button>
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Main Camera Zone - Clean & Plain */}
              <div className="lg:col-span-8">
                <section className="bg-white border-2 border-slate-200 rounded-3xl p-4 md:p-10 shadow-sm relative overflow-hidden flex flex-col h-[700px]">
                  <div className="flex items-center justify-between mb-8 px-4 flex-none">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black tracking-tight text-(--ink-strong)">
                        Camera Feed
                      </h2>
                      <p className="text-xs font-bold text-(--ink-soft) opacity-50 uppercase tracking-widest leading-none">
                        Step: Face identity check
                      </p>
                    </div>
                    <button
                      onClick={toggleChallenge}
                      disabled={actionLoading}
                      className="flex items-center gap-2 h-10 px-6 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-(--ink-soft) hover:bg-slate-50 transition-all"
                    >
                      <svg
                        className={`h-4 w-4 ${actionLoading ? "animate-spin" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {challengeLabel(challenge)}
                    </button>
                  </div>

                  <div className="relative flex-1 w-full overflow-hidden bg-black rounded-2xl">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover scale-x-[-1]"
                    />

                    {/* High-Visibility HUD Overlay */}
                    <div className="pointer-events-none absolute inset-0 z-20 p-6 md:p-10">
                      <div className="absolute inset-4 border border-white/20 rounded-xl" />
                      <div className="absolute top-6 left-6 h-10 w-10 border-l-2 border-t-2 border-white/40 rounded-tl-lg" />
                      <div className="absolute top-6 right-6 h-10 w-10 border-r-2 border-t-2 border-white/40 rounded-tr-lg" />
                      <div className="absolute bottom-6 left-6 h-10 w-10 border-l-2 border-b-2 border-white/40 rounded-bl-lg" />
                      <div className="absolute bottom-6 right-6 h-10 w-10 border-r-2 border-b-2 border-white/40 rounded-br-lg" />
                    </div>

                    {/* Feedback Overlays */}
                    {(actionLoading || lastUser || actionError) && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-white/10 backdrop-blur-md">
                        <div
                          className={`w-full max-w-md rounded-xl p-8 text-center shadow-2xl border-2 transition-all ${
                            actionError
                              ? "bg-rose-600 border-rose-400 text-white"
                              : lastUser?.isWarning
                                ? "bg-amber-500 border-amber-300 text-white shadow-amber-200"
                                : lastUser
                                  ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-200"
                                  : "bg-white border-slate-200 text-slate-900"
                          }`}
                        >
                          {actionLoading && (
                            <div className="space-y-6">
                              <div className="mx-auto h-12 w-12 rounded-lg border-4 border-slate-100 border-t-slate-800 animate-spin" />
                              <p className="text-2xl font-black tracking-tight leading-none uppercase">
                                {message}
                              </p>
                              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                Identifying Face...
                              </p>
                            </div>
                          )}

                          {actionError && (
                            <div className="space-y-4">
                              <div className="mx-auto h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-2xl font-black">!</span>
                              </div>
                              <p className="text-xl font-black tracking-tight leading-none uppercase">
                                {actionError}
                              </p>
                              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                Adjustment required
                              </p>
                            </div>
                          )}

                          {lastUser && (
                            <div className="space-y-4">
                              <div className="mx-auto h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                                <span className="text-2xl font-black">
                                  {lastUser.isWarning ? "!" : "✓"}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                {lastUser.isWarning
                                  ? "Status Update"
                                  : "Identity Verified"}
                              </p>
                              <p className="text-4xl font-black tracking-tighter leading-none">
                                {lastUser.name}
                              </p>
                              <p className="text-sm font-black opacity-70 uppercase tracking-wider">
                                {lastUser.message ||
                                  (lastUser.type === "CLOCK_IN"
                                    ? "Shift Started"
                                    : "Shift Ended")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500" : "bg-rose-500"}`}
                    />
                    {ready ? "System Online" : "System Starting..."}
                  </div>
                </section>
              </div>

              {/* Right: Live Feed */}
              <div className="lg:col-span-4">
                <section className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col h-[700px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black tracking-tight text-(--ink-strong)">
                        Live Activity
                      </h2>
                      <p className="text-xs font-bold text-(--ink-soft) opacity-50 uppercase tracking-widest leading-none">
                        Recent check-ins
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {historyLoading && history.length === 0 ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-16 w-full bg-slate-50 animate-pulse rounded-xl"
                          />
                        ))}
                      </div>
                    ) : history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <svg
                          className="h-12 w-12 opacity-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 tracking-tight">
                                {item.employee.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(item.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                                item.type === "CLOCK_IN"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {item.type === "CLOCK_IN" ? "IN" : "OUT"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <footer className="mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link
            href="/login"
            className="h-10 px-6 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center"
          >
            Manager Desk
          </Link>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">
            Powered by Aierth Kinetic // {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      {/* Global Modals for Errors */}
      {cameraError && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/80 backdrop-blur-3xl px-6">
          <div className="max-w-md w-full bg-white border-2 border-slate-200 rounded-xl p-10 text-center shadow-4xl">
            <h2 className="text-2xl font-black text-rose-600 tracking-tighter mb-4 uppercase">
              Camera Offline
            </h2>
            <p className="text-sm font-bold text-slate-500 mb-10 leading-relaxed uppercase tracking-widest">
              Could not find a valid video input. Verify permissions and
              reconnect device.
            </p>
            <button
              onClick={restart}
              className="h-14 w-full rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all"
            >
              System Reset
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
