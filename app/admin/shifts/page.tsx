"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import { BrandLoader } from "@/components/brand-loader";

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  maxBreakMinutes: number;
};

type Employee = {
  id: string;
  name: string;
  email: string | null;
};

type Assignment = {
  id: string;
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate: string | null;
  employee: { name: string; email: string | null };
  shift: { name: string; startTime: string; endTime: string };
};

export default function ShiftsPage() {
  const { user, loading, session, signOut } = useAuthUser({
    requireAdmin: true,
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    graceMinutes: 15,
    maxBreakMinutes: 60,
  });
  const [newAssign, setNewAssign] = useState({
    employeeId: "",
    shiftId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    if (!session?.access_token) return;
    try {
      setIsLoading(true);
      const [s, e, a] = await Promise.all([
        apiFetch<Shift[]>("/api/admin/shifts", {
          accessToken: session.access_token,
        }),
        apiFetch<Employee[]>("/api/admin/enroll", {
          accessToken: session.access_token,
        }),
        apiFetch<Assignment[]>("/api/admin/shifts/assignments", {
          accessToken: session.access_token,
        }),
      ]);
      setShifts(s);
      setEmployees(e);
      setAssignments(a);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [session?.access_token]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    try {
      setIsRefreshing(true);
      await apiFetch("/api/admin/shifts", {
        method: "POST",
        accessToken: session.access_token,
        body: JSON.stringify(newShift),
      });
      setShowShiftForm(false);
      void fetchData();
    } catch (err) {
      alert("Failed to create shift");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    try {
      setIsRefreshing(true);
      await apiFetch("/api/admin/shifts/assignments", {
        method: "POST",
        accessToken: session.access_token,
        body: JSON.stringify(newAssign),
      });
      setShowAssignForm(false);
      void fetchData();
    } catch (err) {
      alert("Failed to assign shift");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || !user) {
    return <BrandLoader label="Preparing rosters..." />;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_SHIFTS"
          onSignOut={signOut}
        />

        <header className="mb-12 border-l-4 border-blue-600 pl-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
              Shifts & Scheduling.
            </h1>
            <p className="text-md font-bold text-slate-500 max-w-xl">
              Define work hours and assign them to your workforce.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowShiftForm(true)}
              className="h-12 px-8 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Create Shift
            </button>
            <button
              onClick={() => setShowAssignForm(true)}
              className="h-12 px-8 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all active:scale-95"
            >
              Assign Roster
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Shifts Section */}
          <section className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight uppercase">
                Master Shifts
              </h2>
              <span className="text-[10px] font-black text-slate-400">
                {shifts.length} Active
              </span>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-20 bg-white animate-pulse rounded-xl border-2 border-slate-100" />
              ) : (
                shifts.map((shift) => (
                  <article
                    key={shift.id}
                    className="p-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 transition-all"
                  >
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                      {shift.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="text-blue-600 font-black">
                        {shift.startTime} - {shift.endTime}
                      </span>
                      <span className="h-1 w-1 bg-slate-200 rounded-full" />
                      <span>Grace: {shift.graceMinutes}m</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Assignments Section */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight uppercase">
                Live Roster
              </h2>
              <span className="text-[10px] font-black text-slate-400">
                {assignments.length} Assignments
              </span>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Shift</th>
                    <th className="py-4 px-6">Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest"
                      >
                        Loading roster...
                      </td>
                    </tr>
                  ) : assignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest"
                      >
                        No assignments found.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-5 px-6">
                          <p className="text-sm font-black text-slate-900">
                            {a.employee.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 italic">
                            {a.employee.email}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
                            {a.shift.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {a.shift.startTime} - {a.shift.endTime}
                          </p>
                        </td>
                        <td className="py-5 px-6">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            From {new Date(a.startDate).toLocaleDateString()}
                          </p>
                          {a.endDate && (
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                              To {new Date(a.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Create Shift Modal */}
        {showShiftForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
            <form
              onSubmit={handleCreateShift}
              className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200"
            >
              <header className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter">
                  New Base Shift.
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Define standard working hours.
                </p>
              </header>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newShift.name}
                    onChange={(e) =>
                      setNewShift({ ...newShift, name: e.target.value })
                    }
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                    placeholder="Morning Shift"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newShift.startTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, startTime: e.target.value })
                      }
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newShift.endTime}
                      onChange={(e) =>
                        setNewShift({ ...newShift, endTime: e.target.value })
                      }
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Grace (Mins)
                    </label>
                    <input
                      type="number"
                      required
                      value={newShift.graceMinutes}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          graceMinutes: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Max Break (Mins)
                    </label>
                    <input
                      type="number"
                      required
                      value={newShift.maxBreakMinutes}
                      onChange={(e) =>
                        setNewShift({
                          ...newShift,
                          maxBreakMinutes: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShiftForm(false)}
                  className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefreshing}
                  className="flex-1 h-12 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-30"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assign Roster Modal */}
        {showAssignForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
            <form
              onSubmit={handleAssignShift}
              className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200"
            >
              <header className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter">
                  Assign Roster.
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Link an employee to a shift schedule.
                </p>
              </header>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Employee
                  </label>
                  <select
                    required
                    value={newAssign.employeeId}
                    onChange={(e) =>
                      setNewAssign({ ...newAssign, employeeId: e.target.value })
                    }
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold appearance-none"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Shift
                  </label>
                  <select
                    required
                    value={newAssign.shiftId}
                    onChange={(e) =>
                      setNewAssign({ ...newAssign, shiftId: e.target.value })
                    }
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold appearance-none"
                  >
                    <option value="">Select Shift...</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime}-{s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newAssign.startDate}
                    onChange={(e) =>
                      setNewAssign({ ...newAssign, startDate: e.target.value })
                    }
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-4 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefreshing}
                  className="flex-1 h-12 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-30"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
