import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { generatePaySummaries } from "@/lib/server/payroll-service";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);

    const periods = await prisma.payPeriod.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(periods);
  } catch (error) {
    return toErrorResponse(error, "Failed to load pay periods.");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);

    const body = await req.json();
    const { startDate, endDate } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create new Pay Period
    const period = await prisma.payPeriod.create({
      data: {
        organizationId: auth.organizationId,
        startDate: start,
        endDate: end,
        status: "open",
      },
    });

    // Automatically generate initial summaries
    await generatePaySummaries(period.id, auth.organizationId);

    return NextResponse.json({
      success: true,
      period,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create pay period.");
  }
}
