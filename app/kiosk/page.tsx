"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { BrandLogo } from "@/components/brand-logo";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import {
  challengeLabel,
  pickRandomChallenge,
  runLivenessChallenge,
  type LivenessChallenge,
} from "@/lib/liveness";
import { BrandLoader } from "@/components/brand-loader";
import { SyncDB } from "@/lib/client/sync-manager";
import { useAttendanceSync } from "@/lib/client/hooks/use-attendance-sync";

type KioskClockResponse = {
  success: boolean;
  employee: {
    id: string;
    name: string;
    email: string | null;
  };
  entry: {
    id: string;
    type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";
    distance: number;
    timestamp: string;
  };
  threshold: number;
};

type KioskHistoryItem = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";
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
  const { unsyncedCount, isSyncing, updateCount } = useAttendanceSync();

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
  const [isSetup, setIsSetup] = useState(false);
  const [setupToken, setSetupToken] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiFetch<KioskHistoryItem[]>("/api/kiosk/history", {
        requireAuth: false,
      });
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
      // If unauthorized, maybe token is invalid
      if ((err as { status?: number }).status === 401) {
        setIsSetup(true);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("kiosk_token");
    if (!token) {
      setIsSetup(true);
    } else {
      void fetchHistory();
    }
  }, []);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!setupToken.trim()) return;

    setIsActivating(true);
    setActionError("");

    try {
      // Verify token by trying to fetch history
      await apiFetch<KioskHistoryItem[]>("/api/kiosk/history", {
        requireAuth: false,
        kioskToken: setupToken.trim(),
      });

      localStorage.setItem("kiosk_token", setupToken.trim());
      setIsSetup(false);
      void fetchHistory();
    } catch (err) {
      setActionError("Invalid activation token.");
    } finally {
      setIsActivating(false);
    }
  }

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

  async function handleClock(
    type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END",
  ) {
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
      const idempotencyKey = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      try {
        const result = await apiFetch<KioskClockResponse>("/api/kiosk/clock", {
          method: "POST",
          requireAuth: false,
          body: JSON.stringify({ type, embedding, idempotencyKey, timestamp }),
        });

        setLastUser({
          name: result.employee.name,
          type: result.entry.type,
          isWarning: (result.entry as { isWarning?: boolean }).isWarning,
          message: (result.entry as { message?: string }).message,
        });
        setMessage("");
        setChallenge(pickRandomChallenge());
        void fetchHistory();
        void updateCount();

        setTimeout(() => {
          setLastUser(null);
        }, 5000);
      } catch (innerErr: any) {
        if (
          !innerErr.status ||
          innerErr.message.includes("fetch") ||
          !navigator.onLine
        ) {
          // Offline mode! Queue the event.
          await SyncDB.queueEvent({
            type,
            embedding: Array.from(embedding),
            idempotencyKey,
            timestamp,
          });

          setLastUser({
            name: "Offline User",
            type,
            isWarning: true,
            message: "Queued for sync",
          });
          setMessage("");
          setChallenge(pickRandomChallenge());
          void updateCount();

          setTimeout(() => {
            setLastUser(null);
          }, 5000);
        } else {
          throw innerErr;
        }
      }
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

  if (isSetup) {
    return (
      <main className="min-h-screen w-full bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-slate-200 rounded-3xl p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <BrandLogo size="md" className="mx-auto mb-4" />
            <h1 className="text-3xl font-black tracking-tighter leading-none">
              Terminal Setup.
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Enter activation token to bind this device to your organization.
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Activation Token
              </label>
              <input
                type="password"
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                autoFocus
                className="w-full h-14 bg-slate-50 border-2 border-slate-200 px-5 rounded-xl text-lg font-bold text-slate-900 outline-none focus:border-blue-600 transition-all font-mono"
                placeholder="••••••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isActivating || !setupToken.trim()}
              className="w-full h-14 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
            >
              {isActivating ? "Activating..." : "Activate Terminal"}
            </button>
          </form>

          {actionError && (
            <p className="text-center text-[10px] font-black text-rose-600 uppercase tracking-widest animate-pulse">
              {actionError}
            </p>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-center mt-8">
            <Link
              href="/login"
              className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors"
            >
              Manager Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            <BrandLogo size="md" />
            <div className="h-14 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-3 border-slate-200 border-t-blue-500 animate-spin opacity-30" />
            </div>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Hub: Interactions */}
          <div className="lg:col-span-12 space-y-12">
            {/* Interaction Buttons - Clear & Rectangular */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                onClick={() => void handleClock("CLOCK_IN")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-blue-700 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-blue-600 text-white`}
              >
                <span className="text-3xl font-black tracking-tighter">
                  CLOCK IN
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  Starting Shift
                </span>
              </button>

              <button
                onClick={() => void handleClock("BREAK_START")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-amber-600 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-amber-500 text-white`}
              >
                <span className="text-3xl font-black tracking-tighter">
                  START BREAK
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  Lunch / Rest
                </span>
              </button>

              <button
                onClick={() => void handleClock("BREAK_END")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-orange-600 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-orange-500 text-white`}
              >
                <span className="text-3xl font-black tracking-tighter">
                  END BREAK
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  Back to work
                </span>
              </button>

              <button
                onClick={() => void handleClock("CLOCK_OUT")}
                disabled={actionLoading || !ready}
                className={`group relative h-28 flex flex-col items-center justify-center rounded-2xl transition-all ${
                  actionLoading
                    ? "opacity-30 grayscale"
                    : "hover:bg-slate-700 hover:shadow-2xl active:scale-95 shadow-xl"
                } bg-slate-600 text-white`}
              >
                <span className="text-3xl font-black tracking-tighter">
                  CLOCK OUT
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  Finished Shift
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
                                    : lastUser.type === "CLOCK_OUT"
                                      ? "Shift Ended"
                                      : lastUser.type === "BREAK_START"
                                        ? "Break Started"
                                        : "Break Ended")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500" : "bg-rose-500"}`}
                      />
                      {ready ? "System Ready" : "System Starting..."}
                    </div>
                    {unsyncedCount > 0 && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        <span
                          className={`h-2 w-2 rounded-full ${isSyncing ? "bg-blue-500 animate-pulse" : "bg-amber-500"}`}
                        />
                        {unsyncedCount} Queued {isSyncing ? "(Syncing...)" : ""}
                      </div>
                    )}
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
                                  : item.type === "CLOCK_OUT"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {item.type === "CLOCK_IN"
                                ? "IN"
                                : item.type === "CLOCK_OUT"
                                  ? "OUT"
                                  : item.type === "BREAK_START"
                                    ? "BREAK"
                                    : "END BRK"}
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
            Powered securely // {new Date().getFullYear()}
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
