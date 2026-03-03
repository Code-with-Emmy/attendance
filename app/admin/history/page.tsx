"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import { BrandLoader } from "@/components/brand-loader";

type AdminSessionRow = {
  id: string;
  status: "CLOCKED_IN" | "CLOCKED_OUT" | "ON_BREAK";
  workDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  breakMinutes: number;
  lateMinutes: number | null;
  overtimeMinutes: number | null;
  earlyLeaveMinutes: number | null;
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
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function resolveRange(
  preset: RangePreset,
  customStartDate: string,
  customEndDate: string,
): ResolvedRange {
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

  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(endExclusive.getTime()) ||
    start >= endExclusive
  ) {
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

function buildHoursSummaryFromSessions(sessions: AdminSessionRow[]) {
  const grouped = new Map<string, AdminSessionRow[]>();

  for (const session of sessions) {
    const existing = grouped.get(session.employee.id);
    if (existing) {
      existing.push(session);
    } else {
      grouped.set(session.employee.id, [session]);
    }
  }

  const summaries: EmployeeHoursSummary[] = [];
  const hoursByEmployee = new Map<string, number>();

  for (const [employeeId, empSessions] of grouped.entries()) {
    let totalMs = 0;
    let activeSession = false;

    for (const s of empSessions) {
      const start = new Date(s.clockInAt).getTime();
      const end = s.clockOutAt ? new Date(s.clockOutAt).getTime() : Date.now();
      totalMs += end - start - s.breakMinutes * 60000;
      if (s.status === "CLOCKED_IN" || s.status === "ON_BREAK") {
        activeSession = true;
      }
    }

    const totalHours = totalMs / 3_600_000;
    const name = empSessions[0]?.employee.name || "Unknown";

    hoursByEmployee.set(employeeId, totalHours);
    summaries.push({
      employeeId,
      employeeName: name,
      totalHours,
      sessions: empSessions.length,
      activeSession,
    });
  }

  summaries.sort((a, b) => b.totalHours - a.totalHours);

  return { summaries, hoursByEmployee };
}

export default function AdminHistoryPage() {
  const { user, session, loading, signOut } = useAuthUser({
    requireAdmin: true,
  });
  const [sessionRows, setSessionRows] = useState<AdminSessionRow[]>([]);
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
  const [customEndDate, setCustomEndDate] = useState(() =>
    toDateInputValue(new Date()),
  );

  const resolvedRange = useMemo(
    () => resolveRange(rangePreset, customStartDate, customEndDate),
    [rangePreset, customStartDate, customEndDate],
  );

  const { summaries, hoursByEmployee } = useMemo(
    () => buildHoursSummaryFromSessions(sessionRows),
    [sessionRows],
  );

  useEffect(() => {
    if (!session?.access_token || !resolvedRange.valid) return;

    void (async () => {
      setRowsLoading(true);
      setRowsError("");

      try {
        const params = new URLSearchParams();
        params.set("limit", "1000");
        if (resolvedRange.start) params.set("start", resolvedRange.start);
        if (resolvedRange.end) params.set("end", resolvedRange.end);

        const data = await apiFetch<AdminSessionRow[]>(
          `/api/admin/sessions?${params.toString()}`,
          {
            accessToken: session.access_token,
          },
        );
        setSessionRows(data);
      } catch (err) {
        setRowsError(
          err instanceof Error ? err.message : "Failed to load sessions.",
        );
      } finally {
        setRowsLoading(false);
      }
    })();
  }, [
    resolvedRange.end,
    resolvedRange.start,
    resolvedRange.valid,
    session?.access_token,
  ]);

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

      const response = await fetch(
        `/api/admin/history/export?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Export failed.");
        }
        throw new Error(`Export failed.`);
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
      setExportMessage(`Download complete!`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to download report.";
      setRowsError(msg);
    } finally {
      setExportLoading(false);
    }
  }

  if (loading || !user) {
    return <BrandLoader label="Opening history records..." />;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_HISTORY"
          onSignOut={signOut}
        />

        {/* Plain Header */}
        <header className="mb-12 border-l-4 border-emerald-500 pl-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
              Shift Records.
            </h1>
            <p className="text-md font-bold text-slate-500 max-w-xl">
              Audit employee activity and total working hours across any
              timeframe.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exportLoading || !resolvedRange.valid}
            className="h-12 px-8 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
          >
            {exportLoading ? "Generating..." : "Download Spreadsheet"}
          </button>
        </header>

        <section className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Plain Filters */}
          <div className="p-8 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-2">
              {(["TODAY", "WEEK", "MONTH", "CUSTOM"] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRangePreset(preset)}
                  className={`h-9 px-5 rounded-md font-black uppercase tracking-widest text-[9px] transition-all ${
                    rangePreset === preset
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "bg-white border border-slate-300 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {preset === "TODAY"
                    ? "Today"
                    : preset === "WEEK"
                      ? "Current Week"
                      : preset === "MONTH"
                        ? "Current Month"
                        : "Date Picker"}
                </button>
              ))}
            </div>

            {rangePreset === "CUSTOM" && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-xl">
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Range Start
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 px-4 rounded-lg font-bold text-lg text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Range End
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 px-4 rounded-lg font-bold text-lg text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>
              </div>
            )}

            <p className="mt-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
              ACTIVE PERIOD:{" "}
              <span className="text-slate-900">{resolvedRange.label}</span>
            </p>
          </div>

          <div className="p-8">
            {(rowsError || exportMessage) && (
              <div
                className={`mb-8 flex items-center gap-4 px-6 py-4 rounded-xl border-2 shadow-lg ${
                  rowsError
                    ? "bg-rose-600 text-white border-rose-400"
                    : "bg-emerald-600 text-white border-emerald-400"
                }`}
              >
                <span className="text-2xl font-black">
                  {rowsError ? "!" : "✓"}
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {rowsError || exportMessage}
                </p>
              </div>
            )}

            {rowsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : sessionRows.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">
                  No shift records found.
                </p>
              </div>
            ) : (
              <>
                {/* Plain Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
                  {summaries.slice(0, 8).map((summary) => (
                    <article
                      key={summary.employeeId}
                      className="flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-6 hover:bg-white hover:border-blue-200 transition-all group"
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2">
                        Total Time
                      </p>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight mb-4 text-ellipsis overflow-hidden whitespace-nowrap">
                        {summary.employeeName}
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                          {summary.totalHours.toFixed(1)}
                        </span>
                        <span className="text-xs font-black text-slate-400">
                          HRS
                        </span>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {summary.sessions} shifts
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${summary.activeSession ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                {/* Sessions Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                        <th className="py-4 px-6 text-xs text-blue-600">
                          Person
                        </th>
                        <th className="py-4 px-6 text-xs text-blue-600">
                          Status
                        </th>
                        <th className="py-4 px-6 text-xs text-blue-600">
                          Clock In
                        </th>
                        <th className="py-4 px-6 text-xs text-blue-600">
                          Clock Out
                        </th>
                        <th className="py-4 px-6 text-xs text-blue-600 text-right">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sessionRows.map((row) => {
                        const start = new Date(row.clockInAt);
                        const end = row.clockOutAt
                          ? new Date(row.clockOutAt)
                          : null;
                        const durationHrs = end
                          ? (end.getTime() -
                              start.getTime() -
                              row.breakMinutes * 60000) /
                            3600000
                          : (Date.now() -
                              start.getTime() -
                              row.breakMinutes * 60000) /
                            3600000;

                        return (
                          <tr
                            key={row.id}
                            className="group hover:bg-blue-50/20 transition-colors"
                          >
                            <td className="py-5 px-6">
                              <p className="text-lg font-black text-slate-900 tracking-tight">
                                {row.employee.name || "Unknown"}
                              </p>
                              <p className="text-xs font-bold text-slate-400">
                                {row.employee.email}
                              </p>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-4 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                    row.status === "CLOCKED_OUT"
                                      ? "bg-slate-100 text-slate-600"
                                      : row.status === "ON_BREAK"
                                        ? "bg-amber-100 text-amber-600"
                                        : "bg-emerald-100 text-emerald-600"
                                  }`}
                                >
                                  {row.status.replace("_", " ")}
                                </span>
                                {row.status !== "CLOCKED_OUT" && (
                                  <button
                                    onClick={async () => {
                                      if (!session?.access_token) return;
                                      if (
                                        confirm(
                                          `Force close shift for ${row.employee.name}?`,
                                        )
                                      ) {
                                        try {
                                          await apiFetch(
                                            `/api/admin/sessions/${row.id}`,
                                            {
                                              method: "PATCH",
                                              accessToken: session.access_token,
                                              body: JSON.stringify({
                                                status: "CLOCKED_OUT",
                                                clockOutAt:
                                                  new Date().toISOString(),
                                              }),
                                            },
                                          );
                                          window.location.reload();
                                        } catch (err) {
                                          alert("Failed to close shift");
                                        }
                                      }
                                    }}
                                    className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-700 underline"
                                  >
                                    Force Close
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <p className="text-sm font-black text-slate-900">
                                {new Date(row.clockInAt).toLocaleDateString(
                                  [],
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400">
                                  {new Date(row.clockInAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                                {row.lateMinutes ? (
                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded uppercase">
                                    Late {row.lateMinutes}m
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              {row.clockOutAt ? (
                                <>
                                  <p className="text-sm font-black text-slate-900">
                                    {new Date(
                                      row.clockOutAt,
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-slate-400">
                                      {new Date(
                                        row.clockOutAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                    {row.earlyLeaveMinutes ? (
                                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded uppercase">
                                        Early {row.earlyLeaveMinutes}m
                                      </span>
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                                  Currently Active
                                </p>
                              )}
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex flex-col items-end">
                                <p className="text-xl font-black text-slate-900 tracking-tighter">
                                  {durationHrs.toFixed(1)}h
                                </p>
                                <div className="flex gap-2 justify-end">
                                  {row.overtimeMinutes ? (
                                    <span className="text-[8px] font-black text-emerald-600 uppercase">
                                      +{row.overtimeMinutes}m OT
                                    </span>
                                  ) : null}
                                  {row.breakMinutes > 0 && (
                                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                                      -{row.breakMinutes}m break
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
