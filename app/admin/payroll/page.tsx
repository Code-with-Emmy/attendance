"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AppHeader } from "@/components/app-header";
import { BrandLoader } from "@/components/brand-loader";

type PayPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed" | "paid";
};

type PaySummary = {
  id: string;
  employeeId: string;
  employee: {
    name: string;
  };
  totalHours: number;
  overtimeHours: number;
};

export default function PayrollPage() {
  const {
    user,
    loading: authLoading,
    signOut,
  } = useAuthUser({ requireAdmin: true });
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [summaries, setSummaries] = useState<PaySummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(false);

  // New period form
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) loadPeriods();
  }, [user]);

  async function loadPeriods() {
    try {
      setLoading(true);
      const data = await apiFetch<PayPeriod[]>("/api/admin/payroll");
      setPeriods(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pay periods.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePeriod(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch("/api/admin/payroll", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate }),
      });
      setStartDate("");
      setEndDate("");
      await loadPeriods();
    } catch (err: any) {
      setError(err.message || "Failed to create period.");
    } finally {
      setCreating(false);
    }
  }

  async function loadSummaries(period: PayPeriod) {
    setSelectedPeriod(period);
    setSummariesLoading(true);
    try {
      const data = await apiFetch<PaySummary[]>(
        `/api/admin/payroll/${period.id}/summaries`,
      );
      setSummaries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load summaries.");
    } finally {
      setSummariesLoading(false);
    }
  }

  async function refreshSummaries() {
    if (!selectedPeriod) return;
    setSummariesLoading(true);
    try {
      const { summaries: data } = await apiFetch<{ summaries: PaySummary[] }>(
        `/api/admin/payroll/${selectedPeriod.id}/summaries`,
        {
          method: "POST",
        },
      );
      setSummaries(data);
    } catch (err: any) {
      setError(err.message || "Failed to recalculate.");
    } finally {
      setSummariesLoading(false);
    }
  }

  function exportCSV() {
    if (!summaries.length) return;
    const header = "Employee,Total Hours,Overtime Hours\n";
    const rows = summaries
      .map(
        (s) =>
          `"${s.employee.name}",${s.totalHours.toFixed(2)},${s.overtimeHours.toFixed(2)}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `payroll_${selectedPeriod?.startDate}_to_${selectedPeriod?.endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }

  if (authLoading || !user) {
    return <BrandLoader label="Opening payroll export..." />;
  }

  return (
    <main className="admin-shell admin-theme min-h-screen font-(family-name:--font-lato) antialiased text-slate-100 px-6 py-10 lg:px-16 overflow-y-auto w-full">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_PAYROLL"
          onSignOut={signOut}
        />
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Payroll Export
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest leading-relaxed">
              Manage pay periods and export employee summaries
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-xl font-bold text-[10px] uppercase tracking-widest">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 border-b-2 border-slate-100 pb-4">
                  Create New Period
                </h2>
                <form onSubmit={handleCreatePeriod} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full h-12 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    {creating ? "Creating..." : "Create Period"}
                  </button>
                </form>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 border-b-2 border-slate-100 pb-4">
                  Pay Periods
                </h2>
                {loading ? (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Loading...
                  </p>
                ) : periods.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No pay periods found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {periods.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => loadSummaries(p)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPeriod?.id === p.id
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="font-mono text-sm font-bold tracking-tighter">
                          {new Date(p.startDate).toLocaleDateString()} -{" "}
                          {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">
                          Status: {p.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedPeriod ? (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-100">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Summaries for Period
                      </h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        {new Date(
                          selectedPeriod.startDate,
                        ).toLocaleDateString()}{" "}
                        to{" "}
                        {new Date(selectedPeriod.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={refreshSummaries}
                        disabled={summariesLoading}
                        className="h-10 px-4 bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-200 active:scale-95 transition-all"
                      >
                        Recalculate
                      </button>
                      <button
                        onClick={exportCSV}
                        disabled={summariesLoading || summaries.length === 0}
                        className="h-10 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {summariesLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-slate-100 border-t-slate-800 animate-spin" />
                    </div>
                  ) : summaries.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                      <span className="text-4xl mb-4 opacity-50">💸</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        No summaries generated
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-100">
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Employee
                            </th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Total Hours
                            </th>
                            <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                              Overtime
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaries.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <span className="text-sm font-black text-slate-900 tracking-tight">
                                  {s.employee.name}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-mono font-bold text-slate-700">
                                  {s.totalHours.toFixed(2)}h
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span
                                  className={`text-sm font-mono font-bold ${s.overtimeHours > 0 ? "text-amber-600" : "text-slate-400"}`}
                                >
                                  {s.overtimeHours.toFixed(2)}h
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                  <span className="text-4xl mb-4 opacity-50">📅</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Select a pay period
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
