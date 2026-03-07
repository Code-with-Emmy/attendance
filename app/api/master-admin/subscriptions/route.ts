import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    const subscriptions = await prisma.organizationSubscription.findMany({
      include: {
        organization: {
          include: {
            _count: { select: { employees: true, devices: true } }
          }
        },
        subscriptionPlan: true
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = subscriptions.map((sub) => ({
      id: sub.id,
      org: sub.organization.name,
      plan: sub.subscriptionPlan.name,
      status: sub.status === SubscriptionStatus.ACTIVE ? "Active" : "Past Due",
      periodEnd: sub.currentPeriodEnd 
        ? sub.currentPeriodEnd.toISOString().split("T")[0] 
        : "-",
      employees: sub.organization._count.employees,
      devices: sub.organization._count.devices,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
