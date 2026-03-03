import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { SessionStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);

    const body = await req.json();
    const { status, clockOutAt, breakMinutes } = body;

    const session = await prisma.attendanceSession.update({
      where: { 
        id,
        organizationId: auth.organizationId // Security: scoping
      },
      data: {
        status: status as SessionStatus,
        clockOutAt: clockOutAt ? new Date(clockOutAt) : undefined,
        breakMinutes: breakMinutes !== undefined ? parseInt(breakMinutes) : undefined,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    return toErrorResponse(error, "Failed to update attendance session.");
  }
}
