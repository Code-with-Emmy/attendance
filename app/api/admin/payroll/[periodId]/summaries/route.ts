import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { enforceFeatureAccess } from "@/lib/server/billing";
import { toErrorResponse } from "@/lib/server/errors";
import { generatePaySummaries } from "@/lib/server/payroll-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    await enforceFeatureAccess(
      auth.organizationId,
      "payroll",
      "Payroll export",
    );

    const periodId = (await params).periodId;

    const summaries = await prisma.employeePaySummary.findMany({
      where: { payPeriodId: periodId, organizationId: auth.organizationId },
      include: { employee: true },
    });

    return NextResponse.json(summaries);
  } catch (error) {
    return toErrorResponse(error, "Failed to load pay summaries.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    await enforceFeatureAccess(
      auth.organizationId,
      "payroll",
      "Payroll export",
    );

    const periodId = (await params).periodId;

    // Trigger recalculation manual sync
    await generatePaySummaries(periodId, auth.organizationId);

    const summaries = await prisma.employeePaySummary.findMany({
      where: { payPeriodId: periodId, organizationId: auth.organizationId },
      include: { employee: true },
    });

    return NextResponse.json({ success: true, summaries });
  } catch (error) {
    return toErrorResponse(error, "Failed to calculate summaries.");
  }
}
