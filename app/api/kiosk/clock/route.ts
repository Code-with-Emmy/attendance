import { AttendanceType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FACE_MATCH_THRESHOLD, RATE_LIMIT_CONFIG } from "@/lib/config";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { euclideanDistance, toEmbeddingArray } from "@/lib/server/face";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { verifyFaceSchema } from "@/lib/validation";

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
  try {
    const ip = getClientIp(req);
    enforceRateLimit("kiosk-clock", ip, RATE_LIMIT_CONFIG.clock.limit, RATE_LIMIT_CONFIG.clock.windowMs);

    const body = await req.json();
    const type = body?.type as AttendanceType | undefined;
    if (type !== AttendanceType.CLOCK_IN && type !== AttendanceType.CLOCK_OUT) {
      throw new ApiError(400, "Invalid clock type.");
    }

    const parsed = verifyFaceSchema.parse({ embedding: body?.embedding });

    const candidates = await prisma.employee.findMany({
      where: {
        faceEmbedding: {
          not: Prisma.AnyNull,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        faceEmbedding: true,
      },
    });

    if (!candidates.length) {
      throw new ApiError(400, "No enrolled employee faces found. Ask admin to enroll employees.");
    }

    let bestMatch:
      | {
          id: string;
          name: string;
          email: string | null;
          distance: number;
        }
      | null = null;

    for (const candidate of candidates) {
      const stored = toEmbeddingArray(candidate.faceEmbedding);
      if (!stored) {
        continue;
      }

      const distance = euclideanDistance(parsed.embedding, stored);
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          distance,
        };
      }
    }

    if (!bestMatch || bestMatch.distance > FACE_MATCH_THRESHOLD) {
      throw new ApiError(403, "Face not recognized. Try again.");
    }

    const latest = await prisma.attendance.findFirst({
      where: { employeeId: bestMatch.id },
      orderBy: { timestamp: "desc" },
      select: { type: true },
    });

    if (type === AttendanceType.CLOCK_IN && latest?.type === AttendanceType.CLOCK_IN) {
      throw new ApiError(409, `${bestMatch.name} is already clocked in.`);
    }

    if (type === AttendanceType.CLOCK_OUT && latest?.type !== AttendanceType.CLOCK_IN) {
      throw new ApiError(409, `${bestMatch.name} must clock in before clocking out.`);
    }

    const entry = await prisma.attendance.create({
      data: {
        employeeId: bestMatch.id,
        type,
        distance: bestMatch.distance,
        timestamp: new Date(),
        userAgent: req.headers.get("user-agent"),
      },
      select: {
        id: true,
        type: true,
        distance: true,
        timestamp: true,
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: bestMatch.id,
        name: bestMatch.name,
        email: bestMatch.email,
      },
      entry: {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      },
      threshold: FACE_MATCH_THRESHOLD,
    });
  } catch (error) {
    return toErrorResponse(error, "Kiosk clock failed.");
  }
}
