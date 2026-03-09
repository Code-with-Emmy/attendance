"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Activity, KeyRound, ShieldCheck } from "lucide-react";
import { AttendanceActionSelector } from "@/components/AttendanceActionSelector";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BrandLogo } from "@/components/brand-logo";
import { KioskHeader } from "@/components/KioskHeader";
import { LivenessChallengeSelector } from "@/components/LivenessChallengeSelector";
import { LivenessPrompt } from "@/components/LivenessPrompt";
import { RecentActivity } from "@/components/RecentActivity";
import { ScannerFrame } from "@/components/ScannerFrame";
import { StatusPanel } from "@/components/StatusPanel";
import { SuccessCard } from "@/components/SuccessCard";
import type {
  KioskAttendanceType,
  KioskClockResponse,
  KioskHistoryApiItem,
  KioskLivenessStep,
  KioskRecognitionResult,
  KioskRecentActivityItem,
  KioskRequestedAction,
  KioskUiStatus,
} from "@/components/attendance-kiosk-types";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { useAttendanceSync } from "@/lib/client/hooks/use-attendance-sync";
import { SyncDB } from "@/lib/client/sync-manager";
import {
  captureSingleFaceEmbedding,
  detectFacesWithLandmarks,
  loadFaceModels,
} from "@/lib/face-client";
import {
  challengeButtonLabel,
  challengeLabel,
  pickRandomChallenge,
  runLivenessChallenge,
  type LivenessChallenge,
  type LivenessChallengeSelection,
} from "@/lib/liveness";

const WARMING_STATUS: KioskUiStatus = {
  tone: "scanning",
  eyebrow: "System Warmup",
  title: "Initializing secure camera",
  detail:
    "AttendanceKiosk is loading the biometric sensor, device trust, and liveness modules.",
  helper:
    "Stand by. The kiosk will begin verification automatically once the preview is available.",
  meta: ["Camera boot", "Liveness engine", "Device trust"],
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatShortTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(label: string) {
  return label
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function requestedActionLabel(action: KioskRequestedAction) {
  switch (action) {
    case "CLOCK_IN":
      return "Clock In";
    case "CLOCK_OUT":
      return "Clock Out";
    case "BREAK_START":
      return "Break Start";
    case "BREAK_END":
      return "Break End";
    default:
      return "Auto";
  }
}

function attendanceTypeLabel(type: KioskAttendanceType) {
  switch (type) {
    case "CLOCK_OUT":
      return "Clock Out";
    case "BREAK_START":
      return "Break Start";
    case "BREAK_END":
      return "Break End";
    default:
      return "Clock In";
  }
}

function attendanceTypeDirection(type: KioskAttendanceType) {
  return type === "CLOCK_OUT" || type === "BREAK_START" ? "out" : "in";
}

function attendanceSuccessTitle(type: KioskAttendanceType) {
  switch (type) {
    case "CLOCK_OUT":
      return "Clock Out Successful";
    case "BREAK_START":
      return "Break Start Successful";
    case "BREAK_END":
      return "Break End Successful";
    default:
      return "Clock In Successful";
  }
}

function attendanceSuccessDetail(
  type: KioskAttendanceType,
  employeeName: string,
) {
  switch (type) {
    case "CLOCK_OUT":
      return `Goodbye, ${employeeName}`;
    case "BREAK_START":
      return `${employeeName} is now on break`;
    case "BREAK_END":
      return `${employeeName} is back from break`;
    default:
      return `Welcome, ${employeeName}`;
  }
}

function attendanceSuccessMessage(type: KioskAttendanceType) {
  switch (type) {
    case "CLOCK_OUT":
      return "Attendance has been recorded securely.";
    case "BREAK_START":
      return "Break status has been recorded.";
    case "BREAK_END":
      return "Work status has been resumed.";
    default:
      return "Have a great day.";
  }
}

function buildIdleStatus({
  action,
  livenessSelection,
  modelsReady,
  networkOnline,
  unsyncedCount,
}: {
  action: KioskRequestedAction;
  livenessSelection: LivenessChallengeSelection;
  modelsReady: boolean;
  networkOnline: boolean;
  unsyncedCount: number;
}): KioskUiStatus {
  const isAuto = action === "AUTO";

  return {
    tone: "idle",
    eyebrow: isAuto ? "Terminal Ready" : "Action Selected",
    title: isAuto ? "Ready to scan" : `${requestedActionLabel(action)} ready`,
    detail: isAuto
      ? "Look at the camera to clock in or out."
      : `Look at the camera to ${requestedActionLabel(action).toLowerCase()}.`,
    helper:
      livenessSelection === "AUTO"
        ? isAuto
          ? "Auto-start scanning is armed. Keep your face inside the biometric frame."
          : `Manual action selected: ${requestedActionLabel(action)}. Tap Auto to let the kiosk decide automatically.`
        : `Manual liveness challenge set to ${challengeButtonLabel(livenessSelection)}. Keep your face inside the biometric frame.`,
    meta: [
      modelsReady ? "Biometric engine ready" : "Loading biometric engine",
      networkOnline ? "Device online" : "Network offline",
      isAuto ? "Auto mode" : `Manual ${requestedActionLabel(action)}`,
      livenessSelection === "AUTO"
        ? "Random liveness challenge"
        : `Manual ${challengeButtonLabel(livenessSelection)}`,
      unsyncedCount > 0 ? `${unsyncedCount} queued offline` : "Live sync ready",
    ],
  };
}

function mapChallengeToStep(challenge: LivenessChallenge): KioskLivenessStep {
  if (challenge === "BLINK") {
    return {
      id: "blink",
      title: "Blink naturally",
      instruction: challengeLabel(challenge),
      icon: "blink",
    };
  }

  if (challenge === "TURN_HEAD") {
    return {
      id: "turn-head",
      title: "Turn head left and right",
      instruction: challengeLabel(challenge),
      icon: "left",
    };
  }

  if (challenge === "OPEN_MOUTH") {
    return {
      id: "open-mouth",
      title: "Open mouth slightly",
      instruction: challengeLabel(challenge),
      icon: "mouth",
    };
  }

  return {
    id: "nod-head",
    title: "Nod gently",
    instruction: challengeLabel(challenge),
    icon: "up",
  };
}

function buildLivenessSteps(challenge: LivenessChallenge): KioskLivenessStep[] {
  return [
    {
      id: "align",
      title: "Face detected",
      instruction: "Hold your face inside the frame while liveness starts.",
      icon: "still",
    },
    mapChallengeToStep(challenge),
    {
      id: "hold-still",
      title: "Hold still",
      instruction: "Finalizing biometric comparison and attendance decision.",
      icon: "still",
    },
  ];
}

function mapHistoryItem(
  item: KioskHistoryApiItem,
): KioskRecentActivityItem | null {
  if (item.type === "CLOCK_IN" || item.type === "BREAK_END") {
    return {
      id: item.id,
      employeeName: item.employee.name,
      department: null,
      actionLabel: item.type === "CLOCK_IN" ? "Clock In" : "Break End",
      timestampLabel: formatShortTime(item.timestamp),
      direction: "in",
      status: item.type === "CLOCK_IN" ? "success" : "warning",
      avatarLabel: initials(item.employee.name),
      imageUrl: item.employee.imageUrl || null,
    };
  }

  if (item.type === "CLOCK_OUT" || item.type === "BREAK_START") {
    return {
      id: item.id,
      employeeName: item.employee.name,
      department: null,
      actionLabel: item.type === "CLOCK_OUT" ? "Clock Out" : "Break Start",
      timestampLabel: formatShortTime(item.timestamp),
      direction: "out",
      status: item.type === "CLOCK_OUT" ? "success" : "warning",
      avatarLabel: initials(item.employee.name),
      imageUrl: item.employee.imageUrl || null,
    };
  }

  return null;
}

function mapClockResponse(result: KioskClockResponse): KioskRecentActivityItem {
  return {
    id: result.entry.id ?? `${result.employee.id}-${result.entry.timestamp}`,
    employeeName: result.employee.name,
    department: null,
    actionLabel: attendanceTypeLabel(result.entry.type),
    timestampLabel: formatShortTime(result.entry.timestamp),
    direction: attendanceTypeDirection(result.entry.type),
    status: result.entry.isWarning ? "warning" : "success",
    avatarLabel: initials(result.employee.name),
    imageUrl: result.employee.imageUrl || null,
  };
}

function isDeviceTokenError(message: string) {
  return /401|token|device|unauthorized|activated/i.test(message);
}

export function AttendanceKioskScreen() {
  const { videoRef, ready, error: cameraError } = useCamera();
  const { unsyncedCount, updateCount } = useAttendanceSync();

  const [modelsReady, setModelsReady] = useState(false);
  const [phase, setPhase] = useState<
    | "warming"
    | "idle"
    | "liveness"
    | "processing"
    | "success"
    | "warning"
    | "error"
  >("warming");
  const [status, setStatus] = useState<KioskUiStatus>(WARMING_STATUS);
  const [activity, setActivity] = useState<KioskRecentActivityItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] =
    useState<LivenessChallenge>("BLINK");
  const [selectedChallenge, setSelectedChallenge] =
    useState<LivenessChallengeSelection>("AUTO");
  const [successCard, setSuccessCard] = useState<KioskRecognitionResult | null>(
    null,
  );
  const [selectedAction, setSelectedAction] =
    useState<KioskRequestedAction>("AUTO");
  const [networkOnline, setNetworkOnline] = useState(() =>
    typeof window === "undefined" ? true : window.navigator.onLine,
  );
  const [secure] = useState(() =>
    typeof window === "undefined" ? true : window.isSecureContext,
  );
  const [isSetup, setIsSetup] = useState(false);
  const [setupToken, setSetupToken] = useState("");
  const [setupError, setSetupError] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const processingRef = useRef(false);
  const requireClearFrameRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const livenessSteps = buildLivenessSteps(currentChallenge);

  const playFeedback = useEffectEvent(
    (tone: "success" | "error" | "warning") => {
      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

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
        gain.gain.exponentialRampToValueAtTime(
          0.05,
          context.currentTime + note.at + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + note.at + note.duration,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + note.at);
        oscillator.stop(context.currentTime + note.at + note.duration);
      }
    },
  );

  const queueReset = useEffectEvent((nextStatus?: KioskUiStatus) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      processingRef.current = false;
      requireClearFrameRef.current = true;
      setPhase("idle");
      setActiveStepIndex(0);
      setSuccessCard(null);
      setSelectedAction("AUTO");
      setStatus(
        nextStatus ??
          buildIdleStatus({
            action: "AUTO",
            livenessSelection: selectedChallenge,
            modelsReady,
            networkOnline,
            unsyncedCount,
          }),
      );
    }, 3000);
  });

  const loadHistory = useCallback(async (overrideToken?: string) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const items = await apiFetch<KioskHistoryApiItem[]>(
        "/api/kiosk/history",
        {
          requireAuth: false,
          kioskToken: overrideToken,
        },
      );

      startTransition(() => {
        setActivity(
          items
            .map(mapHistoryItem)
            .filter((item): item is KioskRecentActivityItem => item !== null),
        );
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Recent activity is unavailable.";
      setHistoryError(message);

      if (isDeviceTokenError(message)) {
        setIsSetup(true);
        setSetupError(
          "This kiosk needs a valid activation token before it can read attendance data.",
        );
      }
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const sendClockAttempt = useEffectEvent(
    async (embedding: number[], type: KioskAttendanceType, attemptId: string) =>
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

  const resolveAttendance = useEffectEvent(
    async (embedding: number[], requestedAction: KioskRequestedAction) => {
      const attemptId = crypto.randomUUID();
      if (requestedAction !== "AUTO") {
        return sendClockAttempt(embedding, requestedAction, attemptId);
      }

      const firstAttempt = await sendClockAttempt(
        embedding,
        "CLOCK_IN",
        attemptId,
      );

      if (
        firstAttempt.entry.isWarning &&
        firstAttempt.entry.message?.toLowerCase().includes("already clocked in")
      ) {
        return sendClockAttempt(embedding, "CLOCK_OUT", attemptId);
      }

      return firstAttempt;
    },
  );

  const idleStatus = useMemo<KioskUiStatus>(
    () =>
      buildIdleStatus({
        action: selectedAction,
        livenessSelection: selectedChallenge,
        modelsReady,
        networkOnline,
        unsyncedCount,
      }),
    [modelsReady, networkOnline, selectedAction, selectedChallenge, unsyncedCount],
  );

  const failScan = useEffectEvent((message: string) => {
    processingRef.current = true;
    requireClearFrameRef.current = true;
    setPhase("error");
    setActiveStepIndex(1);
    setSuccessCard(null);
    setStatus({
      tone: "error",
      eyebrow: "Verification Failed",
      title: /liveness|blink|head turn|open-mouth|head nod/i.test(message)
        ? "Liveness verification failed"
        : "Face not recognized",
      detail: message,
      helper: "The kiosk will reset automatically after three seconds.",
      meta: [
        networkOnline ? "Network online" : "Network offline",
        selectedAction === "AUTO"
          ? "Auto mode"
          : `Manual ${requestedActionLabel(selectedAction)}`,
        selectedChallenge === "AUTO"
          ? "Random liveness challenge"
          : `Manual ${challengeButtonLabel(selectedChallenge)}`,
      ],
    });
    playFeedback("error");
    queueReset();
  });

  const runScan = useEffectEvent(async () => {
    if (
      !videoRef.current ||
      !ready ||
      !modelsReady ||
      isSetup ||
      processingRef.current ||
      cameraError
    ) {
      return;
    }

    try {
      const detections = await detectFacesWithLandmarks(videoRef.current);

      if (requireClearFrameRef.current) {
        if (detections.length === 0) {
          requireClearFrameRef.current = false;
          processingRef.current = false;
          setPhase("idle");
          setStatus(idleStatus);
        }
        return;
      }

      if (detections.length === 0) {
        if (!processingRef.current && phase !== "idle") {
          setPhase("idle");
          setStatus(idleStatus);
        }
        return;
      }

      if (detections.length > 1) {
        failScan(
          "Multiple faces detected. Ensure only one person is in front of the kiosk.",
        );
        return;
      }

      processingRef.current = true;
      const nextChallenge =
        selectedChallenge === "AUTO"
          ? pickRandomChallenge()
          : selectedChallenge;
      setCurrentChallenge(nextChallenge);
      setPhase("liveness");
      setActiveStepIndex(0);
      setStatus({
        tone: "scanning",
        eyebrow: "Face Detected",
        title: "Starting liveness check",
        detail:
          selectedAction === "AUTO"
            ? "Presence confirmed. Preparing challenge prompt."
            : `Presence confirmed. Preparing ${requestedActionLabel(selectedAction).toLowerCase()} verification.`,
        helper: "Follow the on-screen prompt exactly as shown.",
        meta: [
          networkOnline ? "Network online" : "Network offline",
          selectedAction === "AUTO"
            ? "Auto mode"
            : `Manual ${requestedActionLabel(selectedAction)}`,
          selectedChallenge === "AUTO"
            ? "Random liveness challenge"
            : `Manual ${challengeButtonLabel(selectedChallenge)}`,
        ],
      });

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      });

      setActiveStepIndex(1);
      setStatus({
        tone: "scanning",
        eyebrow: `Step 2 of 3 - Liveness Check`,
        title: mapChallengeToStep(nextChallenge).title,
        detail: challengeLabel(nextChallenge),
        helper: "Stay framed while AttendanceKiosk validates liveness.",
        meta: [
          networkOnline ? "Network online" : "Network offline",
          selectedAction === "AUTO"
            ? "Auto mode"
            : `Manual ${requestedActionLabel(selectedAction)}`,
          selectedChallenge === "AUTO"
            ? "Random liveness challenge"
            : `Manual ${challengeButtonLabel(selectedChallenge)}`,
        ],
      });

      const liveness = await runLivenessChallenge(
        videoRef.current,
        nextChallenge,
      );
      if (!liveness.ok) {
        throw new Error(
          liveness.reason || "Liveness challenge was not detected in time.",
        );
      }

      setPhase("processing");
      setActiveStepIndex(2);
      setStatus({
        tone: "scanning",
        eyebrow: "Face Match Pending",
        title:
          selectedAction === "AUTO"
            ? "Verifying face..."
            : `Verifying ${requestedActionLabel(selectedAction).toLowerCase()}...`,
        detail:
          selectedAction === "AUTO"
            ? "Running secure face comparison and attendance rules."
            : `Running secure face comparison and ${requestedActionLabel(selectedAction).toLowerCase()} rules.`,
        helper: "Hold still for final server verification.",
        meta: [
          networkOnline ? "Network online" : "Network offline",
          selectedAction === "AUTO"
            ? "Auto mode"
            : `Manual ${requestedActionLabel(selectedAction)}`,
          selectedChallenge === "AUTO"
            ? "Random liveness challenge"
            : `Manual ${challengeButtonLabel(selectedChallenge)}`,
        ],
      });

      const embedding = await captureSingleFaceEmbedding(videoRef.current);
      const result = await resolveAttendance(embedding, selectedAction);
      const activityItem = mapClockResponse(result);

      requireClearFrameRef.current = true;
      setPhase(result.entry.isWarning ? "warning" : "success");
      startTransition(() => {
        setActivity((current) =>
          [
            activityItem,
            ...current.filter((item) => item.id !== activityItem.id),
          ].slice(0, 15),
        );
      });

      if (result.entry.isWarning || result.alreadyDone) {
        setSuccessCard(null);
        setStatus({
          tone: "warning",
          eyebrow: "Attendance Requires Review",
          title: result.entry.message ?? "Attendance warning",
          detail: `${result.employee.name} requires a manual review for this attendance action.`,
          helper: `Recorded at ${formatTime(new Date(result.entry.timestamp))}.`,
          meta: [
            networkOnline ? "Synced live" : "Connection unstable",
            selectedAction === "AUTO"
              ? "Auto mode"
              : `Manual ${requestedActionLabel(selectedAction)}`,
            selectedChallenge === "AUTO"
              ? "Random liveness challenge"
              : `Manual ${challengeButtonLabel(selectedChallenge)}`,
          ],
        });
        playFeedback("warning");
        queueReset();
        await loadHistory().catch(() => undefined);
        return;
      }

      const actionLabel = attendanceSuccessTitle(result.entry.type);
      setSuccessCard({
        id: activityItem.id,
        fullName: result.employee.name,
        department: null,
        actionLabel,
        timeLabel: formatTime(new Date(result.entry.timestamp)),
        confidence: null,
        message: attendanceSuccessMessage(result.entry.type),
        avatarLabel: initials(result.employee.name),
        imageUrl: result.employee.imageUrl || null,
      });
      setStatus({
        tone: "success",
        eyebrow: "Attendance Captured",
        title: actionLabel,
        detail: attendanceSuccessDetail(
          result.entry.type,
          result.employee.name,
        ),
        helper: `${formatTime(new Date(result.entry.timestamp))} recorded by this terminal.`,
        meta: [
          networkOnline ? "Synced live" : "Connection unstable",
          selectedAction === "AUTO"
            ? "Auto mode"
            : `Manual ${requestedActionLabel(selectedAction)}`,
          selectedChallenge === "AUTO"
            ? "Random liveness challenge"
            : `Manual ${challengeButtonLabel(selectedChallenge)}`,
        ],
      });
      playFeedback("success");
      queueReset();
      await loadHistory().catch(() => undefined);
    } catch (error) {
      const message = toUserFacingFaceError(error, "Face not recognized.");

      if (isDeviceTokenError(message)) {
        setIsSetup(true);
        setSetupError(
          "This kiosk needs a valid activation token before it can verify attendance.",
        );
        processingRef.current = false;
        return;
      }

      if (
        !navigator.onLine ||
        /fetch|network|failed to fetch|load failed/i.test(message)
      ) {
        requireClearFrameRef.current = true;
        processingRef.current = true;
        setPhase("warning");
        setSuccessCard(null);
        setStatus({
          tone: "warning",
          eyebrow: "Network Unavailable",
          title: "Unable to verify attendance offline",
          detail:
            "Real biometric matching requires the secure server connection. Reconnect this kiosk to continue.",
          helper:
            "No attendance record was created while the network was unavailable.",
          meta: [
            `${unsyncedCount} queued explicit events`,
            selectedAction === "AUTO"
              ? "Auto mode"
              : `Manual ${requestedActionLabel(selectedAction)}`,
            selectedChallenge === "AUTO"
              ? "Random liveness challenge"
              : `Manual ${challengeButtonLabel(selectedChallenge)}`,
          ],
        });
        playFeedback("warning");
        queueReset(
          buildIdleStatus({
            action: "AUTO",
            livenessSelection: selectedChallenge,
            modelsReady,
            networkOnline: false,
            unsyncedCount,
          }),
        );
        return;
      }

      if (message.toLowerCase().startsWith("no face detected")) {
        if (requireClearFrameRef.current) {
          requireClearFrameRef.current = false;
        }
        processingRef.current = false;
        setPhase("idle");
        setStatus(idleStatus);
        return;
      }

      failScan(message);
    }
  });

  useEffect(() => {
    if (isSetup) {
      return;
    }

    let active = true;

    void loadFaceModels()
      .then(() => {
        if (!active) {
          return;
        }
        setModelsReady(true);
        if (ready) {
          setPhase("idle");
          setStatus(idleStatus);
        } else {
          setPhase("warming");
          setStatus(WARMING_STATUS);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!active) {
          return;
        }
        processingRef.current = true;
        setPhase("error");
        setStatus({
          tone: "error",
          eyebrow: "Scanner Unavailable",
          title: "Biometric engine failed",
          detail: "Face recognition models could not be loaded on this device.",
          helper:
            "Refresh the kiosk or verify that the model assets are available locally.",
          meta: ["Model load failed"],
        });
      });

    return () => {
      active = false;
    };
  }, [idleStatus, isSetup, ready]);

  useEffect(() => {
    if (isSetup || cameraError || phase !== "idle" || processingRef.current) {
      return;
    }

    setStatus(idleStatus);
  }, [cameraError, idleStatus, isSetup, phase]);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("kiosk_token")
        : null;

    if (!token) {
      setIsSetup(true);
      setSetupError("");
      return;
    }

    setIsSetup(false);
    void loadHistory(token).catch(() => undefined);
    void updateCount();
  }, [loadHistory, updateCount]);

  useEffect(() => {
    if (isSetup) {
      return;
    }

    const refresh = window.setInterval(() => {
      void loadHistory().catch(() => undefined);
      void updateCount();
    }, 30000);

    return () => {
      window.clearInterval(refresh);
    };
  }, [isSetup, loadHistory, updateCount]);

  useEffect(() => {
    if (!modelsReady || !ready || cameraError || isSetup) {
      return;
    }

    const interval = window.setInterval(() => {
      void runScan();
    }, 1600);

    return () => window.clearInterval(interval);
  }, [cameraError, isSetup, modelsReady, ready]);

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
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
      void SyncDB.clearSynced().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const handleNetwork = () => {
      setNetworkOnline(window.navigator.onLine);
    };

    window.addEventListener("online", handleNetwork);
    window.addEventListener("offline", handleNetwork);

    return () => {
      window.removeEventListener("online", handleNetwork);
      window.removeEventListener("offline", handleNetwork);
    };
  }, []);

  useEffect(() => {
    if (cameraError && !isSetup) {
      setPhase("error");
      setStatus({
        tone: "error",
        eyebrow: "Camera Fallback",
        title: "Camera preview unavailable",
        detail: cameraError,
        helper: "Restore webcam access to resume live biometric verification.",
        meta: [
          networkOnline ? "Network online" : "Network offline",
          "Fallback preview active",
        ],
      });
    }
  }, [cameraError, isSetup, networkOnline]);

  const overlayMessage = isSetup
    ? "Activate this kiosk with a valid device token to enable secure attendance."
    : cameraError
      ? "Restore webcam access to resume live facial verification."
      : phase === "liveness"
        ? (livenessSteps[activeStepIndex]?.instruction ??
          "Follow the active liveness prompt.")
        : phase === "processing"
          ? selectedAction === "AUTO"
            ? "Hold still while the secure server verifies your biometric signature."
            : `Hold still while the kiosk completes ${requestedActionLabel(selectedAction).toLowerCase()}.`
          : phase === "success"
            ? "Biometric match complete. Attendance event recorded."
            : phase === "warning"
              ? "Attendance needs review or the kiosk requires network recovery."
              : phase === "error"
                ? "Verification did not complete. Clear the frame and try again."
                : selectedChallenge !== "AUTO"
                  ? `Manual liveness challenge selected: ${challengeButtonLabel(selectedChallenge)}. Face alignment is monitored continuously.`
                  : selectedAction === "AUTO"
                    ? "Face alignment is monitored continuously for fast clock in and clock out."
                    : `Manual action selected: ${requestedActionLabel(selectedAction)}. Face alignment is monitored continuously.`;

  async function handleActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setupToken.trim()) {
      return;
    }

    setIsActivating(true);
    setSetupError("");

    try {
      await loadHistory(setupToken.trim());
      window.localStorage.setItem("kiosk_token", setupToken.trim());
      setIsSetup(false);
      setSetupToken("");
      setSelectedAction("AUTO");
      setStatus(
        buildIdleStatus({
          action: "AUTO",
          livenessSelection: selectedChallenge,
          modelsReady,
          networkOnline,
          unsyncedCount,
        }),
      );
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : "Invalid activation token.",
      );
      setIsSetup(true);
    } finally {
      setIsActivating(false);
    }
  }

  if (isSetup) {
    return (
      <main className="kiosk-shell relative min-h-screen overflow-hidden px-3 py-3 text-slate-100 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <AmbientBackground />
        <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1840px] items-center justify-center sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="kiosk-panel kiosk-glow grid w-full max-w-5xl gap-4 overflow-hidden rounded-4xl border border-white/10 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/5 p-4 sm:p-6 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%)]" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
                    <BrandLogo size="md" className="h-12 w-12" />
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-medium uppercase tracking-[0.38em] text-slate-400">
                      AttendanceKiosk
                    </p>
                    <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                      Secure Device Activation
                    </h1>
                  </div>
                </div>

                <div className="mt-10 grid gap-4">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-none border border-[#3B82F6]/20 bg-blue-50 text-blue-700">
                        <KeyRound className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Enter activation token
                        </p>
                        <p className="text-sm text-slate-500">
                          Use the one-time device token generated from the admin
                          device manager.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-none border border-[#22C55E]/20 bg-emerald-50 text-emerald-700">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Trusted hardware session
                        </p>
                        <p className="text-sm text-slate-500">
                          Activation binds this browser to a real kiosk device
                          record for live attendance data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-none border border-cyan-200 bg-cyan-50 text-cyan-700">
                        <Activity className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Live history unlocked
                        </p>
                        <p className="text-sm text-slate-500">
                          Once activated, this screen reads real attendance
                          history and posts real clock events.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-4 sm:p-6 lg:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
                Kiosk Setup
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                Activate this terminal
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                This kiosk cannot use real attendance data until a valid device
                token is entered.
              </p>

              <form onSubmit={handleActivate} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Activation Token
                  </span>
                  <input
                    value={setupToken}
                    onChange={(event) => setSetupToken(event.target.value)}
                    placeholder="Paste one-time device token"
                    className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-4 font-mono text-sm text-white outline-none ring-0 transition focus:border-[#3B82F6]/40"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isActivating || !setupToken.trim()}
                  className="w-full rounded-full border border-[#3B82F6]/30 bg-[linear-gradient(135deg,#2563EB,#22D3EE)] px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActivating ? "Activating..." : "Activate Kiosk"}
                </button>
              </form>

              {setupError ? (
                <div className="mt-4 rounded-[1.2rem] border border-[#EF4444]/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {setupError}
                </div>
              ) : null}
            </div>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main className="kiosk-shell relative min-h-screen overflow-hidden px-3 py-3 text-slate-100 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <AmbientBackground />

      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1840px] flex-col gap-4 sm:gap-5 md:gap-6 lg:min-h-[calc(100vh-4rem)]">
        <KioskHeader
          companyName="Main Entrance Terminal"
          terminalName="AttendanceKiosk"
          cameraReady={ready && modelsReady}
          cameraError={cameraError}
          networkOnline={networkOnline}
          secure={secure}
        />

        <div className="flex flex-1 flex-col gap-4 sm:gap-5 md:gap-6 xl:flex-row">
          <section className="flex min-w-0 flex-col gap-4 sm:gap-5 md:gap-6 xl:w-[65%]">
            <AttendanceActionSelector
              selectedAction={selectedAction}
              onSelect={setSelectedAction}
              disabled={phase === "liveness" || phase === "processing"}
            />

            <LivenessChallengeSelector
              selectedChallenge={selectedChallenge}
              onSelect={setSelectedChallenge}
              disabled={phase === "liveness" || phase === "processing"}
            />

            <div>
              <ScannerFrame
                videoRef={videoRef}
                cameraReady={ready}
                cameraError={cameraError}
                phase={phase}
                overlayMessage={overlayMessage}
              />
              <div className="mt-4 flex justify-end">
                <SuccessCard result={successCard} />
              </div>
            </div>

            <LivenessPrompt
              active={phase === "liveness" || phase === "processing"}
              stepIndex={activeStepIndex}
              steps={livenessSteps}
            />
            <StatusPanel status={status} />
          </section>

          <div className="w-full xl:w-[35%] xl:shrink-0">
            <RecentActivity
              items={activity}
              loading={historyLoading}
              error={historyError}
              queueCount={unsyncedCount}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
