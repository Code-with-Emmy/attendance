"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import { BRAND_COMPANY } from "@/lib/branding";
import { BrandLoader } from "@/components/brand-loader";

type AdminHistoryRow = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT";
  timestamp: string;
  distance: number;
  employee: {
    id: string;
    email: string | null;
    name: string | null;
    department: string | null;
    title: string | null;
  };
};

type EmployeeHoursSummary = {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  sessions: number;
  activeSession: boolean;
};

type RangePreset = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

type ResolvedRange = {
  start?: string;
  end?: string;
  label: string;
  valid: boolean;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function resolveRange(preset: RangePreset, customStartDate: string, customEndDate: string): ResolvedRange {
  const now = new Date();

  if (preset === "TODAY") {
    const start = atLocalStartOfDay(now);
    return {
      start: start.toISOString(),
      end: now.toISOString(),
      label: "Today",
      valid: true,
    };
  }

  if (preset === "WEEK") {
    const start = atLocalStartOfDay(now);
    const dayOfWeek = start.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - offset);

    return {
      start: start.toISOString(),
      end: now.toISOString(),
      label: "This week",
      valid: true,
    };
  }

  if (preset === "MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return {
      start: start.toISOString(),
      end: now.toISOString(),
      label: "This month",
      valid: true,
    };
  }

  if (!customStartDate || !customEndDate) {
    return {
      label: "Custom range",
      valid: false,
    };
  }

  const start = new Date(`${customStartDate}T00:00:00`);
  const endExclusive = new Date(`${customEndDate}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(endExclusive.getTime()) || start >= endExclusive) {
    return {
      label: "Custom range",
      valid: false,
    };
  }

  return {
    start: start.toISOString(),
    end: endExclusive.toISOString(),
    label: `${customStartDate} to ${customEndDate}`,
    valid: true,
  };
}

function buildHoursSummary(rows: AdminHistoryRow[]) {
  const grouped = new Map<string, AdminHistoryRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.employee.id);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(row.employee.id, [row]);
    }
  }

  const hoursByEmployee = new Map<string, number>();
  const activeByEmployee = new Map<string, boolean>();
  const summaries: EmployeeHoursSummary[] = [];
  const now = Date.now();

  for (const [employeeId, entries] of grouped.entries()) {
    const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let openClockIn: number | null = null;
    let totalMs = 0;
    let sessions = 0;

    for (const entry of sorted) {
      const ts = new Date(entry.timestamp).getTime();

      if (entry.type === "CLOCK_IN") {
        openClockIn = ts;
        continue;
      }

      if (openClockIn !== null && ts > openClockIn) {
        totalMs += ts - openClockIn;
        sessions += 1;
        openClockIn = null;
      }
    }

    const activeSession = openClockIn !== null;
    if (activeSession && openClockIn !== null && now > openClockIn) {
      totalMs += now - openClockIn;
    }

    const totalHours = totalMs / 3_600_000;
    const name = sorted[sorted.length - 1]?.employee.name || sorted[sorted.length - 1]?.employee.email || "Unknown Employee";

    hoursByEmployee.set(employeeId, totalHours);
    activeByEmployee.set(employeeId, activeSession);
    summaries.push({
      employeeId,
      employeeName: name,
      totalHours,
      sessions,
      activeSession,
    });
  }

  summaries.sort((a, b) => b.totalHours - a.totalHours);

  return {
    summaries,
    hoursByEmployee,
    activeByEmployee,
  };
}

export default function AdminHistoryPage() {
  const { user, session, loading, error, signOut } = useAuthUser({ requireAdmin: true });
  const [rows, setRows] = useState<AdminHistoryRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const [rangePreset, setRangePreset] = useState<RangePreset>("WEEK");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  });
  const [customEndDate, setCustomEndDate] = useState(() => toDateInputValue(new Date()));

  const resolvedRange = useMemo(
    () => resolveRange(rangePreset, customStartDate, customEndDate),
    [rangePreset, customStartDate, customEndDate],
  );

  const rangeValidationError =
    rangePreset === "CUSTOM" && !resolvedRange.valid
      ? "Select a valid custom start and end date range."
      : "";

  const { summaries, hoursByEmployee, activeByEmployee } = useMemo(() => buildHoursSummary(rows), [rows]);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    if (!resolvedRange.valid) {
      return;
    }

    void (async () => {
      setRowsLoading(true);
      setRowsError("");

      try {
        const params = new URLSearchParams();
        params.set("limit", "5000");
        if (resolvedRange.start) {
          params.set("start", resolvedRange.start);
        }
        if (resolvedRange.end) {
          params.set("end", resolvedRange.end);
        }

        const data = await apiFetch<AdminHistoryRow[]>(`/api/admin/history?${params.toString()}`, {
          method: "GET",
          accessToken: session.access_token,
        });
        setRows(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load admin history.";
        setRowsError(msg);
      } finally {
        setRowsLoading(false);
      }
    })();
  }, [resolvedRange.end, resolvedRange.start, resolvedRange.valid, session?.access_token]);

  async function exportCsv() {
    if (!session?.access_token || !resolvedRange.valid) {
      return;
    }

    setExportLoading(true);
    setRowsError("");
    setExportMessage("");

    try {
      const params = new URLSearchParams();
      params.set("limit", "5000");
      if (resolvedRange.start) {
        params.set("start", resolvedRange.start);
      }
      if (resolvedRange.end) {
        params.set("end", resolvedRange.end);
      }

      const response = await fetch(`/api/admin/history/export?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Export failed.");
        }
        throw new Error(`Export failed with status ${response.status}.`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("content-disposition") || "";
      const matched = disposition.match(/filename="([^"]+)"/);
      anchor.href = objectUrl;
      anchor.download = matched?.[1] || "attendance-history.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setExportMessage(`CSV export downloaded for ${resolvedRange.label}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to export attendance records.";
      setRowsError(msg);
    } finally {
      setExportLoading(false);
    }
  }

  if (loading || !user) {
    return <BrandLoader label="Loading attendance analytics..." />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <AppHeader role={user.role} email={user.email} active="ADMIN_HISTORY" onSignOut={signOut} />

      <section className="glass-card reveal rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
              {BRAND_COMPANY}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">Attendance History + Hours</h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Admin-only audit view with worked-hours calculations and payroll-ready date-range export.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exportLoading || !resolvedRange.valid}
            className="btn-solid btn-main"
          >
            {exportLoading ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {(["TODAY", "WEEK", "MONTH", "CUSTOM"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRangePreset(preset)}
                className={`btn-solid ${rangePreset === preset ? "btn-main" : "btn-neutral"}`}
              >
                {preset === "TODAY" ? "Today" : preset === "WEEK" ? "This Week" : preset === "MONTH" ? "This Month" : "Custom"}
              </button>
            ))}
          </div>

          {rangePreset === "CUSTOM" && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Start date</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">End date</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                />
              </label>
            </div>
          )}

          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Active range: <span className="font-semibold text-[var(--ink-strong)]">{resolvedRange.label}</span>
          </p>
          {rangeValidationError && <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{rangeValidationError}</p>}
        </div>

        {(error || rowsError) && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error || rowsError}</p>}
        {exportMessage && <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{exportMessage}</p>}

        {rowsLoading ? (
          <div className="mt-4">
            <BrandLoader label="Loading history records..." compact />
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-[var(--ink-soft)]">No attendance records found for selected range.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {summaries.slice(0, 6).map((summary) => (
                <article key={summary.employeeId} className="display-card rounded-2xl p-4">
                  <p className="text-sm font-semibold text-[var(--ink-strong)]">{summary.employeeName}</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--ink-strong)]">{summary.totalHours.toFixed(2)}h</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>
                      {summary.sessions} completed session{summary.sessions === 1 ? "" : "s"}
                    </span>
                    <span className={`status-chip ${summary.activeSession ? "status-warn" : "status-ok"}`}>
                      {summary.activeSession ? "Clocked In" : "Clocked Out"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-[var(--ink-soft)]">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Distance</th>
                    <th className="px-3 py-2">Hours Worked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 align-top">
                      <td className="px-3 py-2 text-[var(--ink-strong)]">
                        <div className="font-semibold">{row.employee.name || row.employee.email || "Unknown Employee"}</div>
                        <div className="text-xs text-[var(--ink-soft)]">{row.employee.email || "No email"}</div>
                        {(row.employee.department || row.employee.title) && (
                          <div className="text-xs text-[var(--ink-soft)]">
                            {row.employee.department || "-"} / {row.employee.title || "-"}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`status-chip ${row.type === "CLOCK_IN" ? "status-ok" : "status-warn"}`}>
                          {row.type === "CLOCK_IN" ? "Clock In" : "Clock Out"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-soft)]">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-[var(--ink-soft)]">{row.distance.toFixed(4)}</td>
                      <td className="px-3 py-2 text-[var(--ink-soft)]">
                        <p className="font-semibold text-[var(--ink-strong)]">{(hoursByEmployee.get(row.employee.id) || 0).toFixed(2)}h</p>
                        <p className="text-xs">{activeByEmployee.get(row.employee.id) ? "Active shift" : "Closed shift"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
