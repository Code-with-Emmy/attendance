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

    const assignments = await prisma.employeeShiftAssignment.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        employee: { select: { name: true, email: true } },
        shift: { select: { name: true, startTime: true, endTime: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return toErrorResponse(error, "Failed to load shift assignments.");
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
    const { employeeId, shiftId, startDate, endDate } = body;

    const assignment = await prisma.employeeShiftAssignment.create({
      data: {
        employeeId,
        shiftId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        organizationId: auth.organizationId,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return toErrorResponse(error, "Failed to assign shift.");
  }
}
