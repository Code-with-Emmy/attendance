import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { employees: true, devices: true }
        },
        subscription: {
          include: { subscriptionPlan: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      employees: org._count.employees,
      devices: org._count.devices,
      plan: org.subscription?.subscriptionPlan?.name || "No Plan",
      status: org.subscription?.status === SubscriptionStatus.ACTIVE ? "Active" : "Suspended",
      created: org.createdAt.toISOString()
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
