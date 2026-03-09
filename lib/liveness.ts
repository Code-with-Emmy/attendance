import { LIVENESS_TIMEOUT_MS } from "@/lib/config";
import { detectFacesWithLandmarks } from "@/lib/face-client";

export type LivenessChallenge =
  | "BLINK"
  | "TURN_HEAD"
  | "OPEN_MOUTH"
  | "NOD_HEAD"
  | "SMILE"
  | "TILT_HEAD";
export type LivenessChallengeSelection = "AUTO" | LivenessChallenge;

export const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  "TURN_HEAD",
  "OPEN_MOUTH",
  "NOD_HEAD",
  "SMILE",
  "TILT_HEAD",
];

type LivenessResult = {
  ok: boolean;
  reason?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function eyeAspectRatio(eye: Array<{ x: number; y: number }>) {
  if (eye.length < 6) {
    return 0;
  }

  const verticalA = pointDistance(eye[1], eye[5]);
  const verticalB = pointDistance(eye[2], eye[4]);
  const horizontal = pointDistance(eye[0], eye[3]);

  if (!horizontal) {
    return 0;
  }

  return (verticalA + verticalB) / (2 * horizontal);
}

function mouthOpenRatio(mouth: Array<{ x: number; y: number }>) {
  if (mouth.length < 13) {
    return 0;
  }

  const left = mouth[0];
  const right = mouth[6];
  const top = mouth[3];
  const bottom = mouth[9];

  const width = pointDistance(left, right);
  if (!width) {
    return 0;
  }

  const height = pointDistance(top, bottom);
  return height / width;
}

function mouthWidthRatio(
  mouth: Array<{ x: number; y: number }>,
  jaw: Array<{ x: number; y: number }>,
) {
  if (mouth.length < 7 || jaw.length < 17) {
    return 0;
  }

  const mouthWidth = pointDistance(mouth[0], mouth[6]);
  const faceWidth = pointDistance(jaw[0], jaw[16]);

  if (!faceWidth) {
    return 0;
  }

  return mouthWidth / faceWidth;
}

function eyeTiltRatio(
  leftEye: Array<{ x: number; y: number }>,
  rightEye: Array<{ x: number; y: number }>,
) {
  if (leftEye.length === 0 || rightEye.length === 0) {
    return 0;
  }

  const leftCenter = leftEye.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  leftCenter.x /= leftEye.length;
  leftCenter.y /= leftEye.length;

  const rightCenter = rightEye.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  rightCenter.x /= rightEye.length;
  rightCenter.y /= rightEye.length;

  const distance = pointDistance(leftCenter, rightCenter);
  if (!distance) {
    return 0;
  }

  return (rightCenter.y - leftCenter.y) / distance;
}

export function challengeLabel(challenge: LivenessChallenge) {
  if (challenge === "BLINK") {
    return "Blink once naturally.";
  }

  if (challenge === "TURN_HEAD") {
    return "Turn your head left and then right.";
  }

  if (challenge === "OPEN_MOUTH") {
    return "Open your mouth and close it.";
  }

  if (challenge === "SMILE") {
    return "Smile naturally for a moment.";
  }

  if (challenge === "TILT_HEAD") {
    return "Tilt your head left and then right.";
  }

  return "Nod your head down and back up.";
}

export function pickRandomChallenge(): LivenessChallenge {
  const index = Math.floor(Math.random() * LIVENESS_CHALLENGES.length);
  return LIVENESS_CHALLENGES[index] || "TURN_HEAD";
}

export function challengeButtonLabel(challenge: LivenessChallenge) {
  if (challenge === "TURN_HEAD") {
    return "Turn Head";
  }

  if (challenge === "OPEN_MOUTH") {
    return "Open Mouth";
  }

  if (challenge === "NOD_HEAD") {
    return "Nod Head";
  }

  if (challenge === "SMILE") {
    return "Smile";
  }

  if (challenge === "TILT_HEAD") {
    return "Tilt Head";
  }

  return "Blink";
}

export async function runLivenessChallenge(
  video: HTMLVideoElement,
  challenge: LivenessChallenge,
  timeoutMs = LIVENESS_TIMEOUT_MS,
): Promise<LivenessResult> {
  const startedAt = Date.now();

  let baselineEar: number | null = null;
  let sawClosed = false;

  let sawLeft = false;
  let sawRight = false;

  let baselineMouth: number | null = null;
  let sawOpen = false;

  let baselineNoseToEyesRatio: number | null = null;
  let sawNodDown = false;
  let sawNodUp = false;

  let baselineSmile: number | null = null;
  let baselineSmileMouth: number | null = null;

  let baselineTiltRatio: number | null = null;
  let sawTiltLeft = false;
  let sawTiltRight = false;

  while (Date.now() - startedAt <= timeoutMs) {
    const detections = await detectFacesWithLandmarks(video);

    if (detections.length !== 1) {
      await sleep(150);
      continue;
    }

    const landmarks = detections[0].landmarks;

    if (challenge === "BLINK") {
      const leftEar = eyeAspectRatio(landmarks.getLeftEye());
      const rightEar = eyeAspectRatio(landmarks.getRightEye());
      const ear = (leftEar + rightEar) / 2;

      if (!Number.isFinite(ear) || ear <= 0) {
        await sleep(150);
        continue;
      }

      baselineEar = baselineEar === null ? ear : baselineEar * 0.85 + ear * 0.15;

      if (baselineEar > 0 && ear < baselineEar * 0.72) {
        sawClosed = true;
      }

      if (sawClosed && ear > baselineEar * 0.9) {
        return { ok: true };
      }
    } else if (challenge === "TURN_HEAD") {
      const nose = landmarks.getNose();
      const jaw = landmarks.getJawOutline();

      if (nose.length < 4 || jaw.length < 17) {
        await sleep(150);
        continue;
      }

      const leftJaw = jaw[0];
      const rightJaw = jaw[16];
      const faceWidth = rightJaw.x - leftJaw.x;

      if (!faceWidth) {
        await sleep(150);
        continue;
      }

      const centerX = leftJaw.x + faceWidth / 2;
      const noseTip = nose[3];
      const ratio = (noseTip.x - centerX) / faceWidth;

      if (ratio < -0.06) {
        sawLeft = true;
      }

      if (ratio > 0.06) {
        sawRight = true;
      }

      if (sawLeft && sawRight) {
        return { ok: true };
      }
    } else if (challenge === "OPEN_MOUTH") {
      const mouth = landmarks.getMouth();
      const ratio = mouthOpenRatio(mouth);

      if (!Number.isFinite(ratio) || ratio <= 0) {
        await sleep(150);
        continue;
      }

      baselineMouth = baselineMouth === null ? ratio : baselineMouth * 0.85 + ratio * 0.15;

      if (baselineMouth > 0 && ratio > baselineMouth * 1.55) {
        sawOpen = true;
      }

      if (sawOpen && ratio < baselineMouth * 1.12) {
        return { ok: true };
      }
    } else if (challenge === "SMILE") {
      const mouth = landmarks.getMouth();
      const jaw = landmarks.getJawOutline();
      const smileRatio = mouthWidthRatio(mouth, jaw);
      const openRatio = mouthOpenRatio(mouth);

      if (
        !Number.isFinite(smileRatio) ||
        smileRatio <= 0 ||
        !Number.isFinite(openRatio) ||
        openRatio <= 0
      ) {
        await sleep(150);
        continue;
      }

      baselineSmile =
        baselineSmile === null
          ? smileRatio
          : baselineSmile * 0.85 + smileRatio * 0.15;
      baselineSmileMouth =
        baselineSmileMouth === null
          ? openRatio
          : baselineSmileMouth * 0.85 + openRatio * 0.15;

      if (
        baselineSmile > 0 &&
        baselineSmileMouth > 0 &&
        smileRatio > baselineSmile * 1.08 &&
        openRatio < Math.max(baselineSmileMouth * 1.35, baselineSmileMouth + 0.03)
      ) {
        return { ok: true };
      }
    } else if (challenge === "TILT_HEAD") {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const ratio = eyeTiltRatio(leftEye, rightEye);

      if (!Number.isFinite(ratio)) {
        await sleep(150);
        continue;
      }

      baselineTiltRatio =
        baselineTiltRatio === null
          ? ratio
          : baselineTiltRatio * 0.85 + ratio * 0.15;

      if (ratio < baselineTiltRatio - 0.045) {
        sawTiltLeft = true;
      }

      if (ratio > baselineTiltRatio + 0.045) {
        sawTiltRight = true;
      }

      if (sawTiltLeft && sawTiltRight) {
        return { ok: true };
      }
    } else {
      const jaw = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      if (jaw.length < 17 || nose.length < 4 || leftEye.length < 6 || rightEye.length < 6) {
        await sleep(150);
        continue;
      }

      const eyeCenterY =
        [...leftEye, ...rightEye].reduce((sum, point) => sum + point.y, 0) /
        (leftEye.length + rightEye.length);
      const chin = jaw[8];
      const faceHeight = chin.y - eyeCenterY;
      if (!faceHeight) {
        await sleep(150);
        continue;
      }

      const noseTip = nose[3];
      const ratio = (noseTip.y - eyeCenterY) / faceHeight;

      baselineNoseToEyesRatio =
        baselineNoseToEyesRatio === null ? ratio : baselineNoseToEyesRatio * 0.85 + ratio * 0.15;

      if (ratio > baselineNoseToEyesRatio + 0.045) {
        sawNodDown = true;
      }

      if (sawNodDown && ratio < baselineNoseToEyesRatio - 0.025) {
        sawNodUp = true;
      }

      if (sawNodDown && sawNodUp) {
        return { ok: true };
      }
    }

    await sleep(150);
  }

  let reason = "Liveness challenge was not detected in time.";
  if (challenge === "BLINK") {
    reason = "Blink was not detected in time.";
  } else if (challenge === "TURN_HEAD") {
    reason = "Head turn left/right was not detected in time.";
  } else if (challenge === "OPEN_MOUTH") {
    reason = "Open-mouth challenge was not detected in time.";
  } else if (challenge === "NOD_HEAD") {
    reason = "Head nod challenge was not detected in time.";
  } else if (challenge === "SMILE") {
    reason = "Smile challenge was not detected in time.";
  } else if (challenge === "TILT_HEAD") {
    reason = "Head tilt challenge was not detected in time.";
  }

  return {
    ok: false,
    reason,
  };
}
