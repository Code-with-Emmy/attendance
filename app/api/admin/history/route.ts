import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { historyQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit("history-admin", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.history.limit, RATE_LIMIT_CONFIG.history.windowMs);

    const { searchParams } = new URL(req.url);
    const query = historyQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      start: searchParams.get("start") ?? undefined,
      end: searchParams.get("end") ?? undefined,
    });

    const where = {
      organizationId: auth.organizationId,
      ...(query.start || query.end
        ? {
            timestamp: {
              ...(query.start ? { gte: new Date(query.start) } : {}),
              ...(query.end ? { lt: new Date(query.end) } : {}),
            },
          }
        : {}),
    };

    const rows = await prisma.attendance.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: query.limit ?? 500,
      select: {
        id: true,
        type: true,
        distance: true,
        timestamp: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            title: true,
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
    return toErrorResponse(error, "Failed to load admin attendance history.");
  }
}
