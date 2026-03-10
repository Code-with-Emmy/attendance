export type KioskStatusTone = "scanning" | "success" | "warning" | "error";

export type KioskAttendanceType =
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "BREAK_START"
  | "BREAK_END";

export type KioskRequestedAction = "AUTO" | KioskAttendanceType;

export type KioskStatus = {
  tone: KioskStatusTone;
  title: string;
  detail: string;
};

export type KioskUiTone = "idle" | "scanning" | "success" | "warning" | "error";

export type KioskUiStatus = {
  tone: KioskUiTone;
  eyebrow: string;
  title: string;
  detail: string;
  helper: string;
  meta?: string[];
};

export type KioskDeviceHealth = "online" | "degraded" | "offline";

export type KioskLivenessIcon =
  | "blink"
  | "left"
  | "right"
  | "up"
  | "still"
  | "mouth"
  | "smile"
  | "tilt";

export type KioskLivenessStep = {
  id: string;
  title: string;
  instruction: string;
  icon: KioskLivenessIcon;
};

export type KioskRecognitionResult = {
  id: string;
  fullName: string;
  department?: string | null;
  actionLabel: string;
  timeLabel: string;
  confidence?: number | null;
  message: string;
  avatarLabel: string;
  imageUrl?: string | null;
};

export type KioskRecentActivityItem = {
  id: string;
  employeeName: string;
  department?: string | null;
  actionLabel: string;
  timestampLabel: string;
  direction: "in" | "out";
  status: "success" | "warning" | "error";
  avatarLabel: string;
  imageUrl?: string | null;
};

export type KioskClockResponse = {
  success: boolean;
  alreadyDone?: boolean;
  manualVerification?: boolean;
  employee: {
    id: string;
    name: string;
    email: string | null;
    imageUrl?: string | null;
  };
  entry: {
    id?: string;
    type: KioskAttendanceType;
    timestamp: string;
    isWarning?: boolean;
    message?: string;
  };
  threshold?: number;
};

export type KioskHistoryApiItem = {
  id: string;
  type: KioskAttendanceType;
  timestamp: string;
  employee: {
    name: string;
    imageUrl: string | null;
  };
};

export type KioskActivityItem = {
  id: string;
  employeeName: string;
  clockType: "IN" | "OUT";
  clockLabel: string;
  timeLabel: string;
  timestamp: string;
};
