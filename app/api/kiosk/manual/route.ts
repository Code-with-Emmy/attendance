import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { processAttendanceEvent } from "@/lib/server/attendance-service";
import { requireDevice } from "@/lib/server/device-auth";
import { getRequestId, logError, logInfo, withRequestId } from "@/lib/server/observability";
import { getTrustedRequestIp } from "@/lib/server/request-ip";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { kioskManualVerificationSchema } from "@/lib/validation";

function getClientIp(req: Request) {
  return getTrustedRequestIp(req);
}

function buildReviewMessage(employeeName: string, message?: string) {
  if (message) {
    return `${message} Manual verification was used and has been flagged for admin review.`;
  }

  return `Manual verification recorded for ${employeeName}. This attendance action has been flagged for admin review.`;
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const ip = getClientIp(req);

  try {
    const device = await requireDevice(req);

    enforceRateLimit(
      "kiosk-manual",
      ip,
      RATE_LIMIT_CONFIG.clock.limit,
      RATE_LIMIT_CONFIG.clock.windowMs,
    );

    const body = await req.json();
    const parsed = kioskManualVerificationSchema.parse(body);

    const employee = await prisma.employee.findFirst({
      where: {
        organizationId: device.organizationId,
        email: {
          equals: parsed.workEmail,
          mode: "insensitive",
        },
        name: {
          equals: parsed.fullName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        organizationId: true,
      },
    });

    if (!employee) {
      throw new ApiError(
        404,
        "Manual verification failed. Enter the employee's exact full name and registered work email.",
      );
    }

    const result = await processAttendanceEvent({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      type: parsed.type,
      distance: 1,
      userAgent: req.headers.get("user-agent"),
      idempotencyKey: `manual:${device.deviceId}:${crypto.randomUUID()}`,
      timestamp: new Date(),
    });

    const eventId = "id" in result.event ? result.event.id : null;

    await prisma.attendanceViolation.create({
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId,
        type: "MANUAL_KIOSK_VERIFICATION",
        message:
          "Manual kiosk verification was used because biometric verification did not complete.",
        meta: {
          deviceId: device.deviceId,
          deviceName: device.name,
          action: parsed.type,
          reason: parsed.reason,
          employeeEmail: parsed.workEmail,
          attendanceEventId: eventId,
          attendanceResult: result.kind,
          attendanceMessage: result.message ?? null,
        },
      },
    });

    logInfo("Manual kiosk verification recorded", {
      requestId,
      route: "/api/kiosk/manual",
      ip,
      deviceId: device.deviceId,
      employeeId: employee.id,
      action: parsed.type,
      attendanceResult: result.kind,
    });

    return withRequestId(
      NextResponse.json({
        success: true,
        manualVerification: true,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          imageUrl: employee.imageUrl,
        },
        entry: {
          id: eventId ?? undefined,
          type: result.event.type,
          timestamp: result.event.timestamp.toISOString(),
          isWarning: true,
          message: buildReviewMessage(employee.name, result.message),
        },
      }),
      requestId,
    );
  } catch (error) {
    logError("Manual kiosk verification failed", error, {
      requestId,
      route: "/api/kiosk/manual",
      ip,
    });
    return withRequestId(
      toErrorResponse(error, "Manual kiosk verification failed."),
      requestId,
    );
  }
}
