import assert from "node:assert/strict";
import test from "node:test";
import { AttendanceType, SessionStatus } from "@prisma/client";
import { deriveEffectiveSessionStatus } from "../lib/server/attendance-state.ts";

test("deriveEffectiveSessionStatus keeps session status when no attendance exists", () => {
  assert.equal(
    deriveEffectiveSessionStatus({
      sessionStatus: SessionStatus.CLOCKED_IN,
      latestAttendanceType: null,
    }),
    SessionStatus.CLOCKED_IN,
  );
});

test("deriveEffectiveSessionStatus repairs stale clocked-in session after a clock-out event", () => {
  assert.equal(
    deriveEffectiveSessionStatus({
      sessionStatus: SessionStatus.CLOCKED_IN,
      latestAttendanceType: AttendanceType.CLOCK_OUT,
    }),
    SessionStatus.CLOCKED_OUT,
  );
});

test("deriveEffectiveSessionStatus maps break transitions correctly", () => {
  assert.equal(
    deriveEffectiveSessionStatus({
      sessionStatus: SessionStatus.CLOCKED_IN,
      latestAttendanceType: AttendanceType.BREAK_START,
    }),
    SessionStatus.ON_BREAK,
  );

  assert.equal(
    deriveEffectiveSessionStatus({
      sessionStatus: SessionStatus.ON_BREAK,
      latestAttendanceType: AttendanceType.BREAK_END,
    }),
    SessionStatus.CLOCKED_IN,
  );
});
