import assert from "node:assert/strict";
import test from "node:test";
import { AttendanceType } from "@prisma/client";
import { AUTO_CLOCK_OUT_GRACE_MS } from "../lib/config.ts";
import { shouldAutoClockOutFromWarning } from "../lib/client/kiosk-auto-action.ts";

test("recent already-clocked-in warning does not auto clock out", () => {
  const result = shouldAutoClockOutFromWarning(
    {
      success: true,
      alreadyDone: true,
      employee: {
        id: "emp-1",
        name: "Ada",
        email: "ada@example.com",
        imageUrl: null,
      },
      entry: {
        type: AttendanceType.CLOCK_IN,
        timestamp: "2026-03-09T10:00:00.000Z",
        isWarning: true,
        message: "Ada is already clocked in.",
      },
    },
    new Date("2026-03-09T10:01:00.000Z").getTime(),
  );

  assert.equal(result, false);
});

test("older already-clocked-in warning can auto clock out", () => {
  const priorClockInAt = Date.parse("2026-03-09T10:00:00.000Z");
  const result = shouldAutoClockOutFromWarning(
    {
      success: true,
      alreadyDone: true,
      employee: {
        id: "emp-1",
        name: "Ada",
        email: "ada@example.com",
        imageUrl: null,
      },
      entry: {
        type: AttendanceType.CLOCK_IN,
        timestamp: "2026-03-09T10:00:00.000Z",
        isWarning: true,
        message: "Ada is already clocked in.",
      },
    },
    priorClockInAt + AUTO_CLOCK_OUT_GRACE_MS + 1_000,
  );

  assert.equal(result, true);
});

test("non warning responses never auto clock out", () => {
  const result = shouldAutoClockOutFromWarning({
    success: true,
    employee: {
      id: "emp-1",
      name: "Ada",
      email: "ada@example.com",
      imageUrl: null,
    },
    entry: {
      type: AttendanceType.CLOCK_IN,
      timestamp: "2026-03-09T10:00:00.000Z",
    },
  });

  assert.equal(result, false);
});
