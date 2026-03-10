import { AttendanceType, SessionStatus } from "@prisma/client";

function expectedSessionStatusFromAttendance(
  type: AttendanceType,
): SessionStatus {
  if (type === AttendanceType.CLOCK_OUT) {
    return SessionStatus.CLOCKED_OUT;
  }

  if (type === AttendanceType.BREAK_START) {
    return SessionStatus.ON_BREAK;
  }

  return SessionStatus.CLOCKED_IN;
}

export function deriveEffectiveSessionStatus(input: {
  sessionStatus: SessionStatus | null | undefined;
  latestAttendanceType: AttendanceType | null | undefined;
}) {
  if (!input.sessionStatus) {
    return null;
  }

  if (!input.latestAttendanceType) {
    return input.sessionStatus;
  }

  return expectedSessionStatusFromAttendance(input.latestAttendanceType);
}
