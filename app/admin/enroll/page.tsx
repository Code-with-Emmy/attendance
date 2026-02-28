"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CameraPanel } from "@/components/camera-panel";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import {
  challengeLabel,
  pickRandomChallenge,
  runLivenessChallenge,
  type LivenessChallenge,
} from "@/lib/liveness";
import { BRAND_COMPANY } from "@/lib/branding";
import { BrandLoader } from "@/components/brand-loader";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  bio: string | null;
  faceEnrolledAt: string | null;
};

type EmployeeResponse = {
  success: boolean;
  employee: Employee;
};

type EnrollResponse = {
  success: boolean;
  enrolledAt: string | null;
};

export default function AdminEnrollPage() {
  const { user, session, loading, signOut } = useAuthUser({
    requireAdmin: true,
  });
  const { videoRef, ready, error: cameraError, restart } = useCamera();

  const [modelsReady, setModelsReady] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const selectedEmployee = useMemo(
    () => employees.find((entry) => entry.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDepartment, setProfileDepartment] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileBio, setProfileBio] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("");

  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [challenge, setChallenge] = useState<LivenessChallenge>("BLINK");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let mounted = true;
    void loadFaceModels()
      .then(() => {
        if (mounted) setModelsReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setActionError("Camera systems loading...");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!session?.access_token) return;

    setEmployeesLoading(true);
    setActionError("");

    try {
      const data = await apiFetch<Employee[]>("/api/admin/employees", {
        method: "GET",
        accessToken: session.access_token,
      });

      setEmployees(data);
      if (!selectedEmployeeId && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to load employees.",
      );
    } finally {
      setEmployeesLoading(false);
    }
  }, [session?.access_token, selectedEmployeeId]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!selectedEmployee) {
      setProfileName("");
      setProfilePhone("");
      setProfileDepartment("");
      setProfileTitle("");
      setProfileBio("");
      return;
    }
    setProfileName(selectedEmployee.name || "");
    setProfilePhone(selectedEmployee.phone || "");
    setProfileDepartment(selectedEmployee.department || "");
    setProfileTitle(selectedEmployee.title || "");
    setProfileBio(selectedEmployee.bio || "");
  }, [selectedEmployee]);

  async function createEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) return;

    setCreatingEmployee(true);
    setActionError("");
    setMessage("");

    try {
      const response = await apiFetch<EmployeeResponse>(
        "/api/admin/employees",
        {
          method: "POST",
          accessToken: session.access_token,
          body: JSON.stringify({
            name: newName,
            email: newEmail,
            department: newDepartment,
          }),
        },
      );

      setEmployees((prev) => [response.employee, ...prev]);
      setSelectedEmployeeId(response.employee.id);
      setNewName("");
      setNewEmail("");
      setNewDepartment("");
      setMessage(`Employee added.`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to add employee.",
      );
    } finally {
      setCreatingEmployee(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token || !selectedEmployee) return;

    setSavingProfile(true);
    setActionError("");
    setMessage("");

    try {
      const response = await apiFetch<EmployeeResponse>(
        `/api/admin/employees/${selectedEmployee.id}`,
        {
          method: "PUT",
          accessToken: session.access_token,
          body: JSON.stringify({
            name: profileName,
            phone: profilePhone,
            department: profileDepartment,
            title: profileTitle,
            bio: profileBio,
          }),
        },
      );

      setEmployees((prev) =>
        prev.map((entry) =>
          entry.id === response.employee.id ? response.employee : entry,
        ),
      );
      setMessage(`Profile saved.`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function enrollSelectedEmployeeFace() {
    if (!session?.access_token || !videoRef.current || !selectedEmployee)
      return;

    setActionLoading(true);
    setActionError("");
    setMessage(`Ready: ${challengeLabel(challenge)}`);

    try {
      const liveness = await runLivenessChallenge(videoRef.current, challenge);
      if (!liveness.ok) {
        throw new Error(liveness.reason || "Action not clear.");
      }

      const embedding = await captureSingleFaceEmbedding(videoRef.current);
      const result = await apiFetch<EnrollResponse>(
        `/api/admin/employees/${selectedEmployee.id}/face`,
        {
          method: "POST",
          accessToken: session.access_token,
          body: JSON.stringify({ embedding }),
        },
      );

      setEmployees((prev) =>
        prev.map((entry) =>
          entry.id === selectedEmployee.id
            ? { ...entry, faceEnrolledAt: result.enrolledAt }
            : entry,
        ),
      );

      setMessage(`Face registered.`);
      setChallenge(pickRandomChallenge());
    } catch (err) {
      setActionError(toUserFacingFaceError(err, "Could not capture scan."));
    } finally {
      setActionLoading(false);
    }
  }

  async function clearSelectedEmployeeFace() {
    if (!session?.access_token || !selectedEmployee) return;
    if (!confirm(`Delete face scan for ${selectedEmployee.name}?`)) return;

    setActionLoading(true);
    setActionError("");

    try {
      await apiFetch<{ success: boolean }>(
        `/api/admin/employees/${selectedEmployee.id}/face`,
        {
          method: "DELETE",
          accessToken: session.access_token,
        },
      );
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmployee.id ? { ...e, faceEnrolledAt: null } : e,
        ),
      );
      setMessage("Face scan removed.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteEmployee() {
    if (!session?.access_token || !selectedEmployee) return;
    if (!confirm(`Delete ${selectedEmployee.name} from the system?`)) return;

    setActionLoading(true);
    setActionError("");

    try {
      await apiFetch<{ success: boolean }>(
        `/api/admin/employees/${selectedEmployee.id}`,
        {
          method: "DELETE",
          accessToken: session.access_token,
        },
      );
      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
      setSelectedEmployeeId("");
      setMessage("Employee deleted.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !user) {
    return <BrandLoader label="Opening employees list..." />;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_ENROLL"
          onSignOut={signOut}
        />

        {/* Plain Header */}
        <header className="mb-12 border-l-4 border-blue-600 pl-6 space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
            Staff List.
          </h1>
          <p className="text-md font-bold text-slate-500 max-w-xl">
            Register new operators and capture high-resolution face scans for
            verification.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-12 space-y-10">
            {/* List Selection Section */}
            <section className="bg-white border-2 border-slate-200 p-8 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  1. Select Person
                </h2>
                <button
                  onClick={() => void loadEmployees()}
                  disabled={employeesLoading}
                  className="h-10 px-4 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <svg
                    className={`h-4 w-4 ${employeesLoading ? "animate-spin text-blue-600" : "opacity-30"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Sync Data
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-5 rounded-lg text-lg font-bold text-slate-900 outline-none focus:border-blue-600 appearance-none cursor-pointer"
                >
                  {!employees.length && (
                    <option value="">Searching for results...</option>
                  )}
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={4}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </section>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Left: Edit Form */}
              {selectedEmployee && (
                <section className="bg-white border-2 border-slate-200 p-8 rounded-xl shadow-sm">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-8 text-slate-900">
                    2. Profile Settings
                  </h3>

                  <form onSubmit={saveProfile} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {[
                        {
                          label: "Full Name",
                          val: profileName,
                          set: setProfileName,
                        },
                        {
                          label: "Contact Info",
                          val: profilePhone,
                          set: setProfilePhone,
                        },
                        {
                          label: "Sector/Team",
                          val: profileDepartment,
                          set: setProfileDepartment,
                        },
                        {
                          label: "Job Description",
                          val: profileTitle,
                          set: setProfileTitle,
                        },
                      ].map((inp) => (
                        <label key={inp.label} className="block">
                          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {inp.label}
                          </span>
                          <input
                            value={inp.val}
                            onChange={(e) => inp.set(e.target.value)}
                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg px-4 text-md font-bold text-slate-900 transition-all outline-none focus:border-blue-600"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Additional Notes
                      </span>
                      <textarea
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 text-md font-bold text-slate-900 transition-all outline-none focus:border-blue-600"
                      />
                    </label>

                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="h-12 flex-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 active:scale-95 transition-all"
                      >
                        {savingProfile ? "Writing..." : "Commit Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEmployee()}
                        className="h-12 flex-1 rounded-lg border-2 border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Right: Camera Area */}
              <section className="bg-white border-2 border-slate-200 p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    3. Identity Capture
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${selectedEmployee?.faceEnrolledAt ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {selectedEmployee?.faceEnrolledAt ? "ACTIVE" : "PENDING"}
                    </span>
                  </div>
                </div>

                <div className="relative aspect-square xl:aspect-video bg-black rounded-xl overflow-hidden mb-8 border-2 border-slate-200">
                  <CameraPanel
                    videoRef={videoRef}
                    ready={ready}
                    error={cameraError}
                  />

                  {actionLoading && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-30">
                      <div className="w-full max-w-[280px] bg-white border-2 border-slate-200 rounded-xl p-8 text-center shadow-2xl">
                        <div className="h-10 w-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">
                          {message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subtle Framing HUD */}
                  <div className="pointer-events-none absolute inset-0 z-20 p-8 border-8 border-black/10">
                    <div className="absolute inset-4 border border-white/5 rounded-lg" />
                    <div className="absolute top-6 left-6 h-8 w-8 border-l-2 border-t-2 border-white/20 rounded-tl-md" />
                    <div className="absolute top-6 right-6 h-8 w-8 border-r-2 border-t-2 border-white/20 rounded-tr-md" />
                    <div className="absolute bottom-6 left-6 h-8 w-8 border-l-2 border-b-2 border-white/20 rounded-bl-md" />
                    <div className="absolute bottom-6 right-6 h-8 w-8 border-r-2 border-b-2 border-white/20 rounded-br-md" />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => void enrollSelectedEmployeeFace()}
                    disabled={
                      !selectedEmployee ||
                      !ready ||
                      !modelsReady ||
                      actionLoading
                    }
                    className="h-12 w-full rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {actionLoading ? "Processing..." : "Capture Initial Scan"}
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={restart}
                      className="h-10 rounded-md bg-white border border-slate-300 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Reset Camera
                    </button>
                    <button
                      onClick={() => void clearSelectedEmployeeFace()}
                      disabled={!selectedEmployee?.faceEnrolledAt}
                      className="h-10 rounded-md border border-rose-100 text-[9px] font-black text-rose-300 uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-0"
                    >
                      Wipe Biometrics
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom: Quick Add */}
            <section className="bg-slate-100/50 border-2 border-dashed border-slate-300 p-8 rounded-xl">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">
                Direct Registration
              </h4>
              <form
                onSubmit={createEmployee}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end"
              >
                {[
                  { label: "Legal Name", val: newName, set: setNewName },
                  { label: "Email Route", val: newEmail, set: setNewEmail },
                  {
                    label: "Sector Name",
                    val: newDepartment,
                    set: setNewDepartment,
                  },
                ].map((inp) => (
                  <label key={inp.label} className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {inp.label}
                    </span>
                    <input
                      value={inp.val}
                      onChange={(e) => inp.set(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-300 rounded-lg px-4 text-md font-bold text-slate-900 transition-all outline-none focus:border-blue-600"
                      required={inp.label === "Legal Name"}
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={creatingEmployee}
                  className="h-12 bg-white border-2 border-slate-300 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-slate-900 transition-all active:scale-95"
                >
                  {creatingEmployee ? "Registering..." : "Assign to System"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>

      {/* Basic Notifications */}
      {(actionError || message) && !actionLoading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-4 px-8 py-4 rounded-xl border-2 shadow-2xl ${
              actionError
                ? "bg-rose-600 text-white border-rose-400"
                : "bg-emerald-600 text-white border-emerald-400"
            }`}
          >
            <span className="text-2xl font-black">
              {actionError ? "!" : "✓"}
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest">
              {actionError || message}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
