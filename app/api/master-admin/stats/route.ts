import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalOrganizations,
      activeSubscriptions,
      registeredKiosks,
      clockEventsToday
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organizationSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.device.count(),
      prisma.attendance.count({ where: { timestamp: { gte: startOfDay } } })
    ]);

    return NextResponse.json({
      totalOrganizations: {
        value: totalOrganizations,
        change: "+3 this month" // Dummy differential for UI
      },
      activeSubscriptions: {
        value: activeSubscriptions,
        change: "+1 from last month"
      },
      registeredKiosks: {
        value: registeredKiosks,
        change: "+5 this week"
      },
      clockEventsToday: {
        value: clockEventsToday,
        change: "+2% from yesterday"
      }
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
