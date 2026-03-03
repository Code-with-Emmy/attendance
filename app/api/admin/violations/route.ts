import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit("violations-admin", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.history.limit, RATE_LIMIT_CONFIG.history.windowMs);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const violations = await prisma.attendanceViolation.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(violations);
  } catch (error) {
    return toErrorResponse(error, "Failed to load attendance violations.");
  }
}
