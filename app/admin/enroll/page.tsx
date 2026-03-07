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
  runLivenessChallenge,
  type LivenessChallenge,
} from "@/lib/liveness";

import { BrandLoader } from "@/components/brand-loader";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  bio: string | null;
  imageUrl: string | null;
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
  const [profileImageUrl, setProfileImageUrl] = useState("");

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
      setProfileImageUrl("");
      return;
    }
    setProfileName(selectedEmployee.name || "");
    setProfilePhone(selectedEmployee.phone || "");
    setProfileDepartment(selectedEmployee.department || "");
    setProfileTitle(selectedEmployee.title || "");
    setProfileBio(selectedEmployee.bio || "");
    setProfileImageUrl(selectedEmployee.imageUrl || "");
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
            imageUrl: profileImageUrl || null,
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
    <main className="admin-shell admin-theme min-h-screen font-(family-name:--font-lato) antialiased text-slate-100 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_ENROLL"
          onSignOut={signOut}
        />

        <header className="site-card mb-12 rounded-4xl px-8 py-8">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.34em] text-blue-300">
            Enrollment Control
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tighter leading-none text-slate-900 md:text-5xl">
            Staff List.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-slate-400">
            Register new operators and capture high-resolution face scans for
            verification.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-12 space-y-10">
            {/* List Selection Section */}
            <section className="site-card rounded-[1.8rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  1. Select Person
                </h2>
                <button
                  onClick={() => void loadEmployees()}
                  disabled={employeesLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:border-blue-400/24 hover:bg-white/8"
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
                  className="w-full h-12 appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 text-lg font-bold text-white outline-none transition-all focus:border-blue-500 cursor-pointer"
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
                <section className="site-card rounded-[1.8rem] p-8">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-8 text-slate-900">
                    2. Profile Settings
                  </h3>

                  <form onSubmit={saveProfile} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 group">
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 text-slate-400">
                            <svg
                              className="h-8 w-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                        <label className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-slate-950/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProfileImageUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                          Profile Image URL
                        </label>
                        <input
                          value={profileImageUrl}
                          onChange={(e) => setProfileImageUrl(e.target.value)}
                          placeholder="Or paste image URL here..."
                          className="w-full h-10 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-all outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

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
                            className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-md font-bold text-white transition-all outline-none focus:border-blue-500"
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
                        className="w-full h-24 rounded-2xl border border-white/10 bg-white/5 p-4 text-md font-bold text-white transition-all outline-none focus:border-blue-500"
                      />
                    </label>

                    <div className="surface-divider flex gap-4 pt-6">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="h-12 flex-2 rounded-full border border-blue-400/24 bg-[linear-gradient(135deg,#2563EB,#3B82F6_52%,#60A5FA)] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition-all hover:brightness-110 active:scale-95"
                      >
                        {savingProfile ? "Writing..." : "Commit Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEmployee()}
                        className="h-12 flex-1 rounded-full border border-red-400/18 bg-red-500/10 text-red-200 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500/16"
                      >
                        Remove
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Right: Camera Area */}
              <section className="site-card rounded-[1.8rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    3. Identity Capture
                  </h3>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${selectedEmployee?.faceEnrolledAt ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {selectedEmployee?.faceEnrolledAt ? "ACTIVE" : "PENDING"}
                    </span>
                  </div>
                </div>

                <div className="relative mb-8 aspect-square overflow-hidden rounded-[1.6rem] border border-white/10 bg-black xl:aspect-video">
                  <CameraPanel
                    videoRef={videoRef}
                    ready={ready}
                    error={cameraError}
                  />

                  {actionLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-md">
                      <div className="w-full max-w-[280px] rounded-[1.6rem] border border-white/10 bg-slate-950/78 p-8 text-center shadow-[0_24px_56px_rgba(2,6,23,0.48)]">
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-blue-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
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

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Active Challenge
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          "BLINK",
                          "TURN_HEAD",
                          "OPEN_MOUTH",
                          "NOD_HEAD",
                        ] as const
                      ).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setChallenge(c)}
                          className={`h-10 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
                            challenge === c
                              ? "border-blue-400/24 bg-blue-500/14 text-white shadow-[0_18px_40px_rgba(37,99,235,0.2)]"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/18 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          {c.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-slate-400 italic">
                      Action: {challengeLabel(challenge)}
                    </p>
                  </div>

                  <button
                    onClick={() => void enrollSelectedEmployeeFace()}
                    disabled={
                      !selectedEmployee ||
                      !ready ||
                      !modelsReady ||
                      actionLoading
                    }
                    className="h-12 w-full rounded-full border border-blue-400/24 bg-[linear-gradient(135deg,#2563EB,#3B82F6_52%,#60A5FA)] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-30"
                  >
                    {actionLoading ? "Processing..." : "Capture Initial Scan"}
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={restart}
                      className="h-10 rounded-full border border-white/10 bg-white/5 text-[9px] font-black text-slate-300 uppercase tracking-widest transition-all hover:border-blue-400/18 hover:bg-white/8"
                    >
                      Reset Camera
                    </button>
                    <button
                      onClick={() => void clearSelectedEmployeeFace()}
                      disabled={!selectedEmployee?.faceEnrolledAt}
                      className="h-10 rounded-full border border-red-400/18 bg-red-500/10 text-[9px] font-black text-red-200 uppercase tracking-widest transition-all hover:bg-red-500/16 disabled:opacity-0"
                    >
                      Wipe Biometrics
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom: Quick Add */}
            <section className="site-card rounded-[1.8rem] border border-white/10 p-8">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.24em] text-blue-300">
                    Direct Registration
                  </h4>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    Add a staff record immediately, then continue into biometric
                    enrollment and profile completion from the same control
                    surface.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-slate-300">
                  Fast intake
                </span>
              </div>
              <h4 className="sr-only">Direct Registration</h4>
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
                      className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-md font-bold text-white transition-all outline-none focus:border-blue-500"
                      required={inp.label === "Legal Name"}
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={creatingEmployee}
                  className="h-12 rounded-full border border-blue-400/24 bg-[linear-gradient(135deg,#2563EB,#3B82F6_52%,#60A5FA)] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
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
            className={`flex items-center gap-4 rounded-3xl border px-8 py-4 shadow-[0_24px_56px_rgba(2,6,23,0.45)] ${
              actionError
                ? "border-red-400/24 bg-red-500/14 text-white"
                : "border-emerald-400/24 bg-emerald-500/14 text-white"
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
