import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { enforceFeatureAccess } from "@/lib/server/billing";
import { toErrorResponse } from "@/lib/server/errors";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    await enforceFeatureAccess(
      auth.organizationId,
      "shifts",
      "Shift scheduling",
    );

    const shifts = await prisma.shift.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    return toErrorResponse(error, "Failed to load shifts.");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    await enforceFeatureAccess(
      auth.organizationId,
      "shifts",
      "Shift scheduling",
    );

    const body = await req.json();
    const { name, startTime, endTime, graceMinutes, maxBreakMinutes } = body;

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        graceMinutes: graceMinutes || 15,
        maxBreakMinutes: maxBreakMinutes || 60,
        organizationId: auth.organizationId,
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    return toErrorResponse(error, "Failed to create shift.");
  }
}
