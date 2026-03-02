import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";

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
  try {
    const ip = getClientIp(req);
    // Use verify rate limit or common rate limit for public access
    enforceRateLimit("kiosk-history", ip, RATE_LIMIT_CONFIG.verify.limit, RATE_LIMIT_CONFIG.verify.windowMs);

    const rows = await prisma.attendance.findMany({
      orderBy: { timestamp: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        timestamp: true,
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        timestamp: row.timestamp.toISOString(),
      })),
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to load kiosk history.");
  }
}
