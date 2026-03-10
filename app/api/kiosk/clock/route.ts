import { AttendanceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KIOSK_MATCH_THRESHOLD, RATE_LIMIT_CONFIG } from "@/lib/config";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { matchKioskEmployeeFace } from "@/lib/server/kiosk-attendance";
import {
  getRequestId,
  logError,
  logInfo,
  withRequestId,
} from "@/lib/server/observability";
import { getTrustedRequestIp } from "@/lib/server/request-ip";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireDevice } from "@/lib/server/device-auth";
import { verifyFaceSchema } from "@/lib/validation";
import { processAttendanceEvent } from "@/lib/server/attendance-service";

function getClientIp(req: Request) {
  return getTrustedRequestIp(req);
}

type KioskMatchRow = {
  id: string;
  name: string;
  email: string | null;
  imageUrl: string | null;
  organizationId: string;
  matchDistance: number;
};

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const ip = getClientIp(req);

  try {
    const device = await requireDevice(req);

    enforceRateLimit(
      "kiosk-clock",
      ip,
      RATE_LIMIT_CONFIG.clock.limit,
      RATE_LIMIT_CONFIG.clock.windowMs,
    );

    const body = await req.json();
    const type = body?.type as AttendanceType | undefined;
    if (!type) {
      throw new ApiError(400, "Missing clock type.");
    }
    if (!Object.values(AttendanceType).includes(type)) {
      throw new ApiError(400, "Invalid clock type.");
    }

    const parsed = verifyFaceSchema.parse({ embedding: body?.embedding });
    const embeddingStr = `[${parsed.embedding.join(",")}]`;
    const matchThreshold = KIOSK_MATCH_THRESHOLD;

    let matchDecision:
      | {
          employee: {
            id: string;
            name: string;
            email: string | null;
            imageUrl: string | null;
            organizationId: string;
          };
          matchDistance: number;
          matchScore: number;
          matchThreshold: number;
        }
      | null = null;

    // 1. Prefer pgvector matching when vector rows exist for this org.
    const matches = await prisma.$queryRawUnsafe<KioskMatchRow[]>(
      `SELECT e."id", e."name", e."email", e."imageUrl", e."organizationId",
              (v."embedding" <-> $1::vector) as "matchDistance"
       FROM "Employee" e
       JOIN "EmployeeFaceEmbedding" v ON e."id" = v."employeeId"
       WHERE e."organizationId" = $2::uuid
       ORDER BY "matchDistance" ASC
       LIMIT 1`,
      embeddingStr,
      device.organizationId,
    );

    if (matches.length > 0) {
      const bestMatch = matches[0];

      if (bestMatch.matchDistance <= matchThreshold) {
        matchDecision = {
          employee: {
            id: bestMatch.id,
            name: bestMatch.name,
            email: bestMatch.email,
            imageUrl: bestMatch.imageUrl,
            organizationId: bestMatch.organizationId,
          },
          matchDistance: bestMatch.matchDistance,
          matchScore: 1 - bestMatch.matchDistance,
          matchThreshold,
        };
      }
    }

    // 2. Fallback for legacy enrollments stored only on Employee.faceEmbedding.
    if (!matchDecision) {
      const legacyCandidates = await prisma.employee.findMany({
        where: {
          organizationId: device.organizationId,
          faceEnrolledAt: { not: null },
        },
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          organizationId: true,
          faceEmbedding: true,
        },
      });

      const legacyMatch = matchKioskEmployeeFace({
        embedding: parsed.embedding,
        candidates: legacyCandidates,
        threshold: matchThreshold,
      });

      if (legacyMatch.kind === "REJECT") {
        throw new ApiError(legacyMatch.status, legacyMatch.message);
      }

      matchDecision = {
        employee: legacyMatch.employee,
        matchDistance: legacyMatch.matchDistance,
        matchScore: legacyMatch.matchScore,
        matchThreshold: legacyMatch.matchThreshold,
      };
    }

    logInfo("Kiosk match verified", {
      requestId,
      route: "/api/kiosk/clock",
      ip,
      employeeId: matchDecision.employee.id,
      matchScore: matchDecision.matchScore,
      matchDistance: matchDecision.matchDistance,
    });

    // 2. Process with the robust session service
    const result = await processAttendanceEvent({
      employeeId: matchDecision.employee.id,
      organizationId: matchDecision.employee.organizationId as string,
      type,
      distance: matchDecision.matchDistance,
      userAgent: req.headers.get("user-agent"),
      idempotencyKey: body?.idempotencyKey,
      timestamp: body?.timestamp ? new Date(body.timestamp) : new Date(),
    });

    if (result.kind === "WARNING") {
      return withRequestId(
        NextResponse.json({
          success: true,
          alreadyDone: true,
          employee: matchDecision.employee,
          entry: {
            ...result.event,
            timestamp: result.event.timestamp.toISOString(),
            isWarning: true,
            message: result.message,
          },
        }),
        requestId,
      );
    }

    return withRequestId(
      NextResponse.json({
        success: true,
        employee: matchDecision.employee,
        entry: {
          ...result.event,
          timestamp: result.event.timestamp.toISOString(),
        },
        threshold: matchDecision.matchThreshold,
      }),
      requestId,
    );
  } catch (error) {
    logError("Kiosk clock failed", error, {
      requestId,
      route: "/api/kiosk/clock",
      ip,
    });
    return withRequestId(
      toErrorResponse(error, "Kiosk clock failed."),
      requestId,
    );
  }
}
