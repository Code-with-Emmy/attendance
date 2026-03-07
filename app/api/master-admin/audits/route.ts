import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    // Using AttendanceViolation as a partial platform log since we don't have PlatformAuditLog
    const violations = await prisma.attendanceViolation.findMany({
      include: {
        organization: true,
        employee: true
      },
      orderBy: { timestamp: "desc" },
      take: 20
    });

    const formatted = violations.map((v) => {
      return {
        id: v.id,
        type: "anomaly",
        user: v.employee.name,
        org: v.organization.name,
        event: v.message,
        time: v.timestamp.toISOString(),
        ip: "-", // Not tracked in violation right now
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
