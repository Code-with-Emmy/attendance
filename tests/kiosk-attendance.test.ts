import assert from "node:assert/strict";
import test from "node:test";
import { AttendanceType } from "@prisma/client";
import { EMBEDDING_DIMENSION } from "../lib/config.ts";
import {
  evaluateKioskClockAttempt,
  serializeKioskHistoryRows,
} from "../lib/server/kiosk-attendance.ts";

function embedding(value: number) {
  return Array.from({ length: EMBEDDING_DIMENSION }, () => value);
}

test("unknown face is blocked", () => {
  const decision = evaluateKioskClockAttempt({
    type: AttendanceType.CLOCK_IN,
    embedding: embedding(5),
    candidates: [
      {
        id: "emp-1",
        name: "Ada",
        email: "ada@example.com",
        organizationId: "test-org",
        faceEmbedding: embedding(0),
      },
    ],
    latestAttendance: null,
    now: new Date("2026-03-02T09:00:00.000Z"),
  });

  assert.equal(decision.kind, "REJECT");
  assert.equal(decision.status, 403);
  assert.equal(decision.decisionPath, "unknown_face");
});

test("duplicate clock-in is prevented", () => {
  const latestTimestamp = new Date("2026-03-02T09:00:00.000Z");
  const decision = evaluateKioskClockAttempt({
    type: AttendanceType.CLOCK_IN,
    embedding: embedding(0),
    candidates: [
      {
        id: "emp-1",
        name: "Ada",
        email: "ada@example.com",
        organizationId: "test-org",
        faceEmbedding: embedding(0),
      },
    ],
    latestAttendance: {
      type: AttendanceType.CLOCK_IN,
      timestamp: latestTimestamp,
    },
    now: new Date("2026-03-02T10:00:00.000Z"),
  });

  assert.equal(decision.kind, "WARNING");
  assert.equal(decision.decisionPath, "duplicate_clock_in");
  assert.equal(decision.entry.type, AttendanceType.CLOCK_IN);
  assert.equal(decision.entry.timestamp, latestTimestamp.toISOString());
  assert.equal(decision.entry.isWarning, true);
});

test("clock-out before clock-in is prevented", () => {
  const decision = evaluateKioskClockAttempt({
    type: AttendanceType.CLOCK_OUT,
    embedding: embedding(0),
    candidates: [
      {
        id: "emp-1",
        name: "Ada",
        email: "ada@example.com",
        organizationId: "test-org",
        faceEmbedding: embedding(0),
      },
    ],
    latestAttendance: null,
    now: new Date("2026-03-02T10:00:00.000Z"),
  });

  assert.equal(decision.kind, "WARNING");
  assert.equal(decision.decisionPath, "clock_out_without_clock_in");
  assert.equal(decision.entry.type, AttendanceType.CLOCK_OUT);
  assert.equal(decision.entry.isWarning, true);
  assert.match(decision.entry.message, /must clock in/i);
});

test("recent activity feed rows are serialized for the kiosk", () => {
  const rows = [
    {
      id: "att-1",
      type: AttendanceType.CLOCK_IN,
      timestamp: new Date("2026-03-02T08:15:00.000Z"),
      employee: {
        name: "Ada",
      },
    },
    {
      id: "att-2",
      type: AttendanceType.CLOCK_OUT,
      timestamp: new Date("2026-03-02T16:45:00.000Z"),
      employee: {
        name: "Ada",
      },
    },
  ];

  assert.deepEqual(serializeKioskHistoryRows(rows), [
    {
      id: "att-1",
      type: AttendanceType.CLOCK_IN,
      timestamp: "2026-03-02T08:15:00.000Z",
      employee: {
        name: "Ada",
      },
    },
    {
      id: "att-2",
      type: AttendanceType.CLOCK_OUT,
      timestamp: "2026-03-02T16:45:00.000Z",
      employee: {
        name: "Ada",
      },
    },
  ]);
});
