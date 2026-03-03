import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export async function generatePaySummaries(payPeriodId: string, organizationId: string) {
  const payPeriod = await prisma.payPeriod.findUnique({
    where: { id: payPeriodId, organizationId },
  });

  if (!payPeriod) {
    throw new ApiError(404, "Pay period not found");
  }

  // 1. Get all closed sessions within this pay period
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      organizationId,
      workDate: {
        gte: payPeriod.startDate,
        lte: payPeriod.endDate,
      },
      status: "CLOCKED_OUT",
    },
  });

  // 2. Group sessions by employeeId
  const employeeData: Record<
    string,
    { totalHours: number; overtimeHours: number; sessionsCount: number }
  > = {};

  for (const session of sessions) {
    if (!session.clockOutAt) continue; // Should be impossible due to status

    const durationMs = session.clockOutAt.getTime() - session.clockInAt.getTime();
    const breakMs = session.breakMinutes * 60000;
    const workHours = Math.max(0, durationMs - breakMs) / 3600000;
    const overtimeHours = (session.overtimeMinutes ?? 0) / 60;

    if (!employeeData[session.employeeId]) {
      employeeData[session.employeeId] = { totalHours: 0, overtimeHours: 0, sessionsCount: 0 };
    }

    employeeData[session.employeeId].totalHours += workHours;
    employeeData[session.employeeId].overtimeHours += overtimeHours;
    employeeData[session.employeeId].sessionsCount += 1;
  }

  // 3. Upsert EmployeePaySummary for each employee
  const upserts = Object.entries(employeeData).map(
    async ([employeeId, { totalHours, overtimeHours, sessionsCount }]) => {
      return prisma.employeePaySummary.upsert({
        where: {
          employeeId_payPeriodId: { employeeId, payPeriodId },
        },
        update: {
          totalHours,
          overtimeHours,
          meta: { sessionsCount },
        },
        create: {
          employeeId,
          organizationId,
          payPeriodId,
          totalHours,
          overtimeHours,
          meta: { sessionsCount },
        },
      });
    },
  );

  await Promise.all(upserts);

  return { success: true, processedCount: upserts.length };
}
