import { AttendanceType, SessionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export type SessionResult = {
  kind: "SUCCESS" | "WARNING";
  message?: string;
  session?: any;
  event: any;
};

async function getEmployeeShift(employeeId: string, workDate: Date, organizationId: string) {
  const override = await prisma.shiftOverride.findFirst({
    where: { employeeId, date: workDate, organizationId },
    include: { shift: true },
  });
  if (override) return override.shift;

  const assignment = await prisma.employeeShiftAssignment.findFirst({
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

  // 1.5 Check Idempotency
  if (idempotencyKey) {
    const existingEvent = await prisma.attendance.findUnique({
      where: { idempotencyKey },
      include: { session: true },
    });
    if (existingEvent) {
      return {
        kind: "SUCCESS",
        session: existingEvent.session,
        event: existingEvent,
      };
    }
  }

  // 2. Find active session (most recent one that isn't fully closed, or just the one for today)
  // Re-clocking logic might span midnight, but let's stick to simple "per day" first.
  let session = await prisma.attendanceSession.findUnique({
    where: {
      employeeId_workDate: {
        employeeId,
        workDate,
      },
    },
  });

  // 3. Handle Transitions
  if (type === AttendanceType.CLOCK_IN) {
    if (session && session.status !== SessionStatus.CLOCKED_OUT) {
      // Violation: Double Clock In
      await prisma.attendanceViolation.create({
        data: {
          employeeId,
          organizationId,
          type: "DOUBLE_CLOCK_IN",
          message: "Employee attempted to clock in while already active.",
          meta: { sessionId: session.id, eventType: type },
        },
      });

      // Return a warning but show the existing session
      return {
        kind: "WARNING",
        message: "You are already clocked in.",
        session,
        event: {
          type,
          timestamp: session.clockInAt,
        }
      };
    }

    // Success: New session or reopening closed one
    const shift = await getEmployeeShift(employeeId, workDate, organizationId);
    let lateMinutes = 0;
    if (shift) {
      const shiftStart = parseTime(shift.startTime, timestamp);
      const diffMs = timestamp.getTime() - shiftStart.getTime();
      if (diffMs > shift.graceMinutes * 60000) {
        lateMinutes = Math.floor(diffMs / 60000);
      }
    }

    if (!session) {
      session = await prisma.attendanceSession.create({
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
      session = await prisma.attendanceSession.update({
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
    if (!session || session.status === SessionStatus.CLOCKED_OUT) {
      // Violation: Clock out without in
      await prisma.attendanceViolation.create({
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
        }
      };
    }

    // Success: Close session
    const shift = await getEmployeeShift(employeeId, workDate, organizationId);
    let overtimeMinutes = 0;
    let earlyLeaveMinutes = 0;

    if (shift) {
      const shiftEnd = parseTime(shift.endTime, timestamp);
      const shiftStart = parseTime(shift.startTime, timestamp);
      const shiftDurationMs = shiftEnd.getTime() - shiftStart.getTime();
      
      const workDurationMs = timestamp.getTime() - session.clockInAt.getTime() - (session.breakMinutes * 60000);
      
      const diffEndMs = shiftEnd.getTime() - timestamp.getTime();
      if (diffEndMs > 0) {
        earlyLeaveMinutes = Math.floor(diffEndMs / 60000);
      }

      if (workDurationMs > shiftDurationMs) {
        overtimeMinutes = Math.floor((workDurationMs - shiftDurationMs) / 60000);
      }
    }

    session = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.CLOCKED_OUT,
        clockOutAt: timestamp,
        overtimeMinutes,
        earlyLeaveMinutes,
      },
    });
  } else if (type === AttendanceType.BREAK_START) {
    if (!session || session.status !== SessionStatus.CLOCKED_IN) {
      await prisma.attendanceViolation.create({
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
      };
    }

    session = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.ON_BREAK,
      },
    });
  } else if (type === AttendanceType.BREAK_END) {
    if (!session || session.status !== SessionStatus.ON_BREAK) {
      await prisma.attendanceViolation.create({
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
      };
    }

    const lastBreakStart = await prisma.attendance.findFirst({
      where: {
        sessionId: session.id,
        type: AttendanceType.BREAK_START,
      },
      orderBy: { timestamp: "desc" },
    });

    const breakAdd = lastBreakStart 
      ? Math.floor((timestamp.getTime() - lastBreakStart.timestamp.getTime()) / 60000)
      : 0;

    session = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.CLOCKED_IN,
        breakMinutes: { increment: breakAdd },
      },
    });
  }

  // 4. Create the append-only event
  const event = await prisma.attendance.create({
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

  return {
    kind: "SUCCESS",
    session,
    event,
  };
}
