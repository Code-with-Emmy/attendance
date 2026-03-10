export const FACE_MATCH_THRESHOLD = 0.55;
export const EMBEDDING_DIMENSION = 128;
export const KIOSK_MATCH_THRESHOLD = 0.35;
export const KIOSK_FACE_DETECTED_DELAY_MS = 5_000;
export const KIOSK_PREMIUM_STABLE_ALIGNMENT_FRAMES = 4;
export const KIOSK_RESULT_DISPLAY_MS = 6_000;
export const FACE_DETECTOR_SCORE_THRESHOLD = 0.72;

export const LIVENESS_TIMEOUT_MS = 8_000;
export const VERIFY_PROOF_TTL_MS = 90_000;
export const AUTO_CLOCK_OUT_GRACE_MS = 2 * 60_000;

export const RATE_LIMIT_CONFIG = {
  enroll: { limit: 10, windowMs: 60_000 },
  verify: { limit: 40, windowMs: 60_000 },
  clock: { limit: 30, windowMs: 60_000 },
  faceDelete: { limit: 10, windowMs: 60_000 },
  profile: { limit: 20, windowMs: 60_000 },
  history: { limit: 120, windowMs: 60_000 },
  publicDemo: { limit: 8, windowMs: 60_000 },
  publicContact: { limit: 8, windowMs: 60_000 },
  publicTrial: { limit: 4, windowMs: 60_000 },
  publicPurchase: { limit: 6, windowMs: 60_000 },
  publicForgotPassword: { limit: 6, windowMs: 60_000 },
  publicResetPassword: { limit: 10, windowMs: 60_000 },
} as const;
