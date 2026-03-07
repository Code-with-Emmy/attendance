import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { toErrorResponse } from "@/lib/server/errors";
import { serializeKioskHistoryRows } from "@/lib/server/kiosk-attendance";
import {
  getRequestId,
  logError,
  logInfo,
  withRequestId,
} from "@/lib/server/observability";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireDevice } from "@/lib/server/device-auth";

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

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const ip = getClientIp(req);

  try {
    const device = await requireDevice(req);

    enforceRateLimit(
      "kiosk-history",
      ip,
      RATE_LIMIT_CONFIG.verify.limit,
      RATE_LIMIT_CONFIG.verify.windowMs,
    );

    const rows = await prisma.attendance.findMany({
      where: { organizationId: device.organizationId },
      orderBy: { timestamp: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        timestamp: true,
        employee: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    logInfo("Kiosk history loaded", {
      requestId,
      route: "/api/kiosk/history",
      ip,
      rowCount: rows.length,
    });

    return withRequestId(
      NextResponse.json(serializeKioskHistoryRows(rows)),
      requestId,
    );
  } catch (error) {
    logError("Kiosk history failed", error, {
      requestId,
      route: "/api/kiosk/history",
      ip,
    });
    return withRequestId(
      toErrorResponse(error, "Failed to load kiosk history."),
      requestId,
    );
  }
}
