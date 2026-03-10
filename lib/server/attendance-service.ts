import {
  Attendance,
  AttendanceSession,
  AttendanceType,
  Prisma,
  SessionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveEffectiveSessionStatus } from "@/lib/server/attendance-state";

export type SessionResult = {
  kind: "SUCCESS" | "WARNING";
  message?: string;
  session?: AttendanceSession | null;
  event:
    | Attendance
    | {
        type: AttendanceType;
        timestamp: Date;
      };
};

type AttendanceTransaction = Prisma.TransactionClient;

async function getEmployeeShift(
  tx: AttendanceTransaction,
  employeeId: string,
  workDate: Date,
  organizationId: string,
) {
  const override = await tx.shiftOverride.findFirst({
    where: { employeeId, date: workDate, organizationId },
    include: { shift: true },
  });
  if (override) return override.shift;

  const assignment = await tx.employeeShiftAssignment.findFirst({
    where: {
      employeeId,
      organizationId,
      startDate: { lte: workDate },
      OR: [{ endDate: null }, { endDate: { gte: workDate } }],
    },
    include: { shift: true },
  });
  return assignment?.shift;
}

function parseTime(timeStr: string, date: Date) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function processAttendanceEvent({
  employeeId,
  organizationId,
  type,
  distance,
  userAgent,
  timestamp = new Date(),
  idempotencyKey,
}: {
  employeeId: string;
  organizationId: string;
  type: AttendanceType;
  distance: number;
  userAgent: string | null;
  timestamp?: Date;
  idempotencyKey?: string;
}): Promise<SessionResult> {
  // 1. Get today's date for session grouping (using local date or UTC?)
  // For simplicity, we use local date (Y-M-D)
  const workDate = new Date(timestamp);
  workDate.setHours(0, 0, 0, 0);

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existingEvent = await tx.attendance.findUnique({
        where: { idempotencyKey },
        include: { session: true },
      });
      if (existingEvent) {
        return {
          kind: "SUCCESS",
          session: existingEvent.session,
          event: existingEvent,
        } satisfies SessionResult;
      }
    }

    let session = await tx.attendanceSession.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate,
        },
      },
    });

    let latestSessionAttendance = session
      ? await tx.attendance.findFirst({
          where: { sessionId: session.id },
          orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
        })
      : null;

    const effectiveStatus = deriveEffectiveSessionStatus({
      sessionStatus: session?.status,
      latestAttendanceType: latestSessionAttendance?.type,
    });

    if (session && effectiveStatus && session.status !== effectiveStatus) {
      session = await tx.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: effectiveStatus,
          clockOutAt:
            effectiveStatus === SessionStatus.CLOCKED_OUT
              ? latestSessionAttendance?.timestamp ?? session.clockOutAt
              : null,
        },
      });
    }

    if (type === AttendanceType.CLOCK_IN) {
      if (session && effectiveStatus !== SessionStatus.CLOCKED_OUT) {
        await tx.attendanceViolation.create({
          data: {
            employeeId,
            organizationId,
            type: "DOUBLE_CLOCK_IN",
            message: "Employee attempted to clock in while already active.",
            meta: { sessionId: session.id, eventType: type },
          },
        });

        return {
          kind: "WARNING",
          message: "You are already clocked in.",
          session,
          event: {
            type,
            timestamp: session.clockInAt,
          },
        } satisfies SessionResult;
      }

      const shift = await getEmployeeShift(tx, employeeId, workDate, organizationId);
      let lateMinutes = 0;
      if (shift) {
        const shiftStart = parseTime(shift.startTime, timestamp);
        const diffMs = timestamp.getTime() - shiftStart.getTime();
        if (diffMs > shift.graceMinutes * 60000) {
          lateMinutes = Math.floor(diffMs / 60000);
        }
      }

      if (!session) {
        session = await tx.attendanceSession.create({
          data: {
            employeeId,
            organizationId,
            workDate,
            status: SessionStatus.CLOCKED_IN,
            clockInAt: timestamp,
            lateMinutes,
          },
        });
      } else {
        session = await tx.attendanceSession.update({
          where: { id: session.id },
          data: {
            status: SessionStatus.CLOCKED_IN,
            clockInAt: timestamp,
            clockOutAt: null,
            lateMinutes,
          },
        });
      }
    } else if (type === AttendanceType.CLOCK_OUT) {
      if (!session || effectiveStatus === SessionStatus.CLOCKED_OUT) {
        await tx.attendanceViolation.create({
          data: {
            employeeId,
            organizationId,
            type: "CLOCK_OUT_WITHOUT_IN",
            message: "Employee attempted to clock out without an active session.",
            meta: { eventType: type },
          },
        });

        return {
          kind: "WARNING",
          message: "You must clock in before clocking out.",
          event: {
            type,
            timestamp,
          },
        } satisfies SessionResult;
      }

      const shift = await getEmployeeShift(tx, employeeId, workDate, organizationId);
      let overtimeMinutes = 0;
      let earlyLeaveMinutes = 0;

      if (shift) {
        const shiftEnd = parseTime(shift.endTime, timestamp);
        const shiftStart = parseTime(shift.startTime, timestamp);
        const shiftDurationMs = shiftEnd.getTime() - shiftStart.getTime();

        const workDurationMs =
          timestamp.getTime() -
          session.clockInAt.getTime() -
          session.breakMinutes * 60000;

        const diffEndMs = shiftEnd.getTime() - timestamp.getTime();
        if (diffEndMs > 0) {
          earlyLeaveMinutes = Math.floor(diffEndMs / 60000);
        }

        if (workDurationMs > shiftDurationMs) {
          overtimeMinutes = Math.floor(
            (workDurationMs - shiftDurationMs) / 60000,
          );
        }
      }

      session = await tx.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.CLOCKED_OUT,
          clockOutAt: timestamp,
          overtimeMinutes,
          earlyLeaveMinutes,
        },
      });
    } else if (type === AttendanceType.BREAK_START) {
      if (!session || effectiveStatus !== SessionStatus.CLOCKED_IN) {
        await tx.attendanceViolation.create({
          data: {
            employeeId,
            organizationId,
            type: "INVALID_BREAK_START",
            message: "Employee attempted to start a break while not clocked in.",
            meta: { eventType: type },
          },
        });

        return {
          kind: "WARNING",
          message: "You must be clocked in to start a break.",
          event: { type, timestamp },
        } satisfies SessionResult;
      }

      session = await tx.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.ON_BREAK,
        },
      });
    } else if (type === AttendanceType.BREAK_END) {
      if (!session || effectiveStatus !== SessionStatus.ON_BREAK) {
        await tx.attendanceViolation.create({
          data: {
            employeeId,
            organizationId,
            type: "INVALID_BREAK_END",
            message: "Employee attempted to end a break while not on break.",
            meta: { eventType: type },
          },
        });

        return {
          kind: "WARNING",
          message: "You are not currently on a break.",
          event: { type, timestamp },
        } satisfies SessionResult;
      }

      const lastBreakStart = await tx.attendance.findFirst({
        where: {
          sessionId: session.id,
          type: AttendanceType.BREAK_START,
        },
        orderBy: { timestamp: "desc" },
      });

      const breakAdd = lastBreakStart
        ? Math.floor(
            (timestamp.getTime() - lastBreakStart.timestamp.getTime()) / 60000,
          )
        : 0;

      session = await tx.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.CLOCKED_IN,
          breakMinutes: { increment: breakAdd },
        },
      });
    }

    const event = await tx.attendance.create({
      data: {
        employeeId,
        organizationId,
        sessionId: session?.id,
        type,
        distance,
        userAgent,
        idempotencyKey,
        timestamp,
      },
    });

    latestSessionAttendance = event;

    return {
      kind: "SUCCESS",
      session,
      event: latestSessionAttendance,
    } satisfies SessionResult;
  });
}
