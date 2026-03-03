import { AttendanceType } from "@prisma/client";
import { FACE_MATCH_THRESHOLD } from "../config.ts";
import { euclideanDistance, toEmbeddingArray } from "./face.ts";

type KioskClockCandidate = {
  id: string;
  name: string;
  email: string | null;
  organizationId: string;
  faceEmbedding: unknown;
};

type KioskLatestAttendance = {
  type: AttendanceType;
  timestamp: Date;
};

type MatchedEmployee = {
  id: string;
  name: string;
  email: string | null;
  organizationId: string;
};

type MatchMetrics = {
  matchDistance: number | null;
  matchScore: number | null;
  matchThreshold: number;
};

type ConfirmedMatchMetrics = {
  matchDistance: number;
  matchScore: number;
  matchThreshold: number;
};

type KioskClockRejectDecision = MatchMetrics & {
  kind: "REJECT";
  status: number;
  message: string;
  decisionPath: "no_enrolled_faces" | "unknown_face";
};

type KioskClockMatchDecision = ConfirmedMatchMetrics & {
  kind: "MATCH";
  employee: MatchedEmployee;
};

type KioskClockWarningDecision = ConfirmedMatchMetrics & {
  kind: "WARNING";
  decisionPath: "duplicate_clock_in" | "clock_out_without_clock_in";
  employee: MatchedEmployee;
  entry: {
    type: AttendanceType;
    timestamp: string;
    isWarning: true;
    message: string;
  };
};

type KioskClockCreateDecision = ConfirmedMatchMetrics & {
  kind: "CREATE";
  decisionPath: "create_entry";
  employee: MatchedEmployee;
  createData: {
    employeeId: string;
    organizationId: string;
    type: AttendanceType;
    distance: number;
    timestamp: Date;
    userAgent: string | null;
  };
};

export type KioskClockDecision =
  | KioskClockRejectDecision
  | KioskClockWarningDecision
  | KioskClockCreateDecision;

export type KioskFaceMatchDecision =
  | KioskClockRejectDecision
  | KioskClockMatchDecision;

type EvaluateKioskClockAttemptOptions = {
  type: AttendanceType;
  embedding: number[];
  candidates: KioskClockCandidate[];
  latestAttendance: KioskLatestAttendance | null;
  now?: Date;
  threshold?: number;
  userAgent?: string | null;
};

function toMatchScore(distance: number) {
  return Number(Math.max(0, 1 - distance).toFixed(4));
}

function findBestMatch(
  embedding: number[],
  candidates: KioskClockCandidate[],
) {
  let bestMatch:
    | {
        employee: MatchedEmployee;
        distance: number;
        score: number;
      }
    | null = null;

  for (const candidate of candidates) {
    const stored = toEmbeddingArray(candidate.faceEmbedding);
    if (!stored) {
      continue;
    }

    const distance = euclideanDistance(embedding, stored);
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        employee: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          organizationId: candidate.organizationId,
        },
        distance,
        score: toMatchScore(distance),
      };
    }
  }

  return bestMatch;
}

export function matchKioskEmployeeFace({
  embedding,
  candidates,
  threshold = FACE_MATCH_THRESHOLD,
}: Pick<
  EvaluateKioskClockAttemptOptions,
  "embedding" | "candidates" | "threshold"
>): KioskFaceMatchDecision {
  const validCandidates = candidates.filter(
    (candidate) => toEmbeddingArray(candidate.faceEmbedding) !== null,
  );

  if (validCandidates.length === 0) {
    return {
      kind: "REJECT",
      status: 400,
      message: "No enrolled employee faces found. Ask admin to enroll employees.",
      decisionPath: "no_enrolled_faces",
      matchDistance: null,
      matchScore: null,
      matchThreshold: threshold,
    };
  }

  const bestMatch = findBestMatch(embedding, validCandidates);

  if (!bestMatch || bestMatch.distance > threshold) {
    return {
      kind: "REJECT",
      status: 403,
      message: "Face not recognized. Try again.",
      decisionPath: "unknown_face",
      matchDistance: bestMatch?.distance ?? null,
      matchScore: bestMatch?.score ?? null,
      matchThreshold: threshold,
    };
  }

  return {
    kind: "MATCH",
    employee: bestMatch.employee,
    matchDistance: bestMatch.distance,
    matchScore: bestMatch.score,
    matchThreshold: threshold,
  };
}

export function evaluateKioskClockAttempt({
  type,
  embedding,
  candidates,
  latestAttendance,
  now = new Date(),
  threshold = FACE_MATCH_THRESHOLD,
  userAgent = null,
}: EvaluateKioskClockAttemptOptions): KioskClockDecision {
  const matchDecision = matchKioskEmployeeFace({
    embedding,
    candidates,
    threshold,
  });

  if (matchDecision.kind === "REJECT") {
    return matchDecision;
  }

  return decideKioskClockForMatch({
    type,
    match: matchDecision,
    latestAttendance,
    now,
    userAgent,
  });
}

export function decideKioskClockForMatch({
  type,
  match,
  latestAttendance,
  now = new Date(),
  userAgent = null,
}: {
  type: AttendanceType;
  match: KioskClockMatchDecision;
  latestAttendance: KioskLatestAttendance | null;
  now?: Date;
  userAgent?: string | null;
}): KioskClockDecision {
  if (
    type === AttendanceType.CLOCK_IN &&
    latestAttendance?.type === AttendanceType.CLOCK_IN
  ) {
    return {
      kind: "WARNING",
      decisionPath: "duplicate_clock_in",
      employee: match.employee,
      entry: {
        type: latestAttendance.type,
        timestamp: latestAttendance.timestamp.toISOString(),
        isWarning: true,
        message: `${match.employee.name} is already clocked in.`,
      },
      matchDistance: match.matchDistance,
      matchScore: match.matchScore,
      matchThreshold: match.matchThreshold,
    };
  }

  if (
    type === AttendanceType.CLOCK_OUT &&
    latestAttendance?.type !== AttendanceType.CLOCK_IN
  ) {
    return {
      kind: "WARNING",
      decisionPath: "clock_out_without_clock_in",
      employee: match.employee,
      entry: {
        type: AttendanceType.CLOCK_OUT,
        timestamp: now.toISOString(),
        isWarning: true,
        message: `${match.employee.name} must clock in before clocking out.`,
      },
      matchDistance: match.matchDistance,
      matchScore: match.matchScore,
      matchThreshold: match.matchThreshold,
    };
  }

  return {
    kind: "CREATE",
    decisionPath: "create_entry",
    employee: match.employee,
    createData: {
      employeeId: match.employee.id,
      organizationId: match.employee.organizationId,
      type,
      distance: match.matchDistance,
      timestamp: now,
      userAgent,
    },
    matchDistance: match.matchDistance,
    matchScore: match.matchScore,
    matchThreshold: match.matchThreshold,
  };
}

type KioskHistoryRow = {
  id: string;
  type: AttendanceType;
  timestamp: Date;
  employee: {
    name: string;
  };
};

export function serializeKioskHistoryRows(rows: KioskHistoryRow[]) {
  return rows.map((row) => ({
    ...row,
    timestamp: row.timestamp.toISOString(),
  }));
}
