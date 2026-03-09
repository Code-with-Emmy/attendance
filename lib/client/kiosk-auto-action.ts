import type { KioskClockResponse } from "../../components/attendance-kiosk-types.ts";
import { AUTO_CLOCK_OUT_GRACE_MS } from "../config.ts";

export function shouldAutoClockOutFromWarning(
  result: KioskClockResponse,
  now = Date.now(),
) {
  if (
    !result.entry.isWarning ||
    result.entry.type !== "CLOCK_IN" ||
    !result.entry.message?.toLowerCase().includes("already clocked in")
  ) {
    return false;
  }

  const priorClockInAt = Date.parse(result.entry.timestamp);
  if (!Number.isFinite(priorClockInAt)) {
    return false;
  }

  return now - priorClockInAt > AUTO_CLOCK_OUT_GRACE_MS;
}
