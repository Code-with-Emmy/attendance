import { AttendanceType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import {
  decideKioskClockForMatch,
  matchKioskEmployeeFace,
} from "@/lib/server/kiosk-attendance";
import {
  getRequestId,
  logError,
  logInfo,
  withRequestId,
} from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireDevice } from "@/lib/server/device-auth";
import { verifyFaceSchema } from "@/lib/validation";
import { processAttendanceEvent } from "@/lib/server/attendance-service";

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }
  return req.headers.get("x-real-ip") || "unknown";
}

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

    const parsed = verifyFaceSchema.parse({ embedding: body?.embedding });
    const embeddingStr = `[${parsed.embedding.join(",")}]`;

    // 1. Scalable pgvector matching (Phase 5)
    // We search across all stored embeddings for this organization
    const matches = await prisma.$queryRawUnsafe<any[]>(
      `SELECT e."id", e."name", e."email", e."organizationId",
              (v."embedding" <-> $1::vector) as "matchDistance"
       FROM "Employee" e
       JOIN "EmployeeFaceEmbedding" v ON e."id" = v."employeeId"
       WHERE e."organizationId" = $2::uuid
       ORDER BY "matchDistance" ASC
       LIMIT 1`,
      embeddingStr,
      device.organizationId
    );

    if (matches.length === 0) {
      throw new ApiError(401, "Face not recognized. Please enroll first.");
    }

    const bestMatch = matches[0];
    
    // threshold Check (Legacy similarity thresholding)
    const matchThreshold = 0.45; // lower is better for L2
    if (bestMatch.matchDistance > matchThreshold) {
       throw new ApiError(401, "Face match confidence too low.");
    }

    const matchDecision = {
      kind: "SUCCESS" as const,
      employee: bestMatch,
      matchDistance: bestMatch.matchDistance,
      matchScore: 1 - bestMatch.matchDistance,
      matchThreshold
    };

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
