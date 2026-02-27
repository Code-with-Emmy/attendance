"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CameraPanel } from "@/components/camera-panel";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCamera } from "@/hooks/use-camera";
import { apiFetch } from "@/lib/client/api";
import { toUserFacingFaceError } from "@/lib/client/face-errors";
import { captureSingleFaceEmbedding, loadFaceModels } from "@/lib/face-client";
import { challengeLabel, pickRandomChallenge, runLivenessChallenge, type LivenessChallenge } from "@/lib/liveness";
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
  const { user, session, loading, error, signOut } = useAuthUser({ requireAdmin: true });
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
  const [newPhone, setNewPhone] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBio, setNewBio] = useState("");

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
        if (mounted) {
          setModelsReady(true);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setActionError("Failed to load face models from /public/models.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setEmployeesLoading(true);
    setActionError("");

    try {
      const data = await apiFetch<Employee[]>("/api/admin/employees", {
        method: "GET",
        accessToken: session.access_token,
      });

      setEmployees(data);
      setSelectedEmployeeId((prev) => {
        if (prev && data.some((entry) => entry.id === prev)) {
          return prev;
        }
        return data[0]?.id || "";
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load employees.";
      setActionError(msg);
    } finally {
      setEmployeesLoading(false);
    }
  }, [session?.access_token]);

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
    if (!session?.access_token) {
      return;
    }

    setCreatingEmployee(true);
    setActionError("");
    setMessage("");

    try {
      const response = await apiFetch<EmployeeResponse>("/api/admin/employees", {
        method: "POST",
        accessToken: session.access_token,
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          department: newDepartment,
          title: newTitle,
          bio: newBio,
        }),
      });

      setEmployees((prev) => [response.employee, ...prev.filter((entry) => entry.id !== response.employee.id)]);
      setSelectedEmployeeId(response.employee.id);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewDepartment("");
      setNewTitle("");
      setNewBio("");
      setMessage(`Employee created: ${response.employee.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create employee.";
      setActionError(msg);
    } finally {
      setCreatingEmployee(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token || !selectedEmployee) {
      return;
    }

    setSavingProfile(true);
    setActionError("");
    setMessage("");

    try {
      const response = await apiFetch<EmployeeResponse>(`/api/admin/employees/${selectedEmployee.id}`, {
        method: "PUT",
        accessToken: session.access_token,
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          department: profileDepartment,
          title: profileTitle,
          bio: profileBio,
        }),
      });

      setEmployees((prev) => prev.map((entry) => (entry.id === response.employee.id ? response.employee : entry)));
      setMessage(`Saved profile for ${response.employee.name}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update employee.";
      setActionError(msg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function enrollSelectedEmployeeFace() {
    if (!session?.access_token || !videoRef.current || !selectedEmployee) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setMessage(`Liveness challenge: ${challengeLabel(challenge)}`);

    try {
      const liveness = await runLivenessChallenge(videoRef.current, challenge);
      if (!liveness.ok) {
        throw new Error(liveness.reason || "Liveness challenge failed.");
      }

      const embedding = await captureSingleFaceEmbedding(videoRef.current);
      const result = await apiFetch<EnrollResponse>(`/api/admin/employees/${selectedEmployee.id}/face`, {
        method: "POST",
        accessToken: session.access_token,
        body: JSON.stringify({ embedding }),
      });

      setEmployees((prev) =>
        prev.map((entry) =>
          entry.id === selectedEmployee.id
            ? {
                ...entry,
                faceEnrolledAt: result.enrolledAt,
              }
            : entry,
        ),
      );

      setMessage(
        result.enrolledAt
          ? `Face enrolled for ${selectedEmployee.name} at ${new Date(result.enrolledAt).toLocaleString()}.`
          : `Face enrolled for ${selectedEmployee.name}.`,
      );
      setChallenge(pickRandomChallenge());
    } catch (err) {
      setActionError(toUserFacingFaceError(err, "Failed to enroll selected employee face."));
    } finally {
      setActionLoading(false);
    }
  }

  async function clearSelectedEmployeeFace() {
    if (!session?.access_token || !selectedEmployee) {
      return;
    }

    const confirmed = window.confirm(`Delete face data for ${selectedEmployee.name}?`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setMessage("");

    try {
      await apiFetch<{ success: boolean }>(`/api/admin/employees/${selectedEmployee.id}/face`, {
        method: "DELETE",
        accessToken: session.access_token,
      });

      setEmployees((prev) =>
        prev.map((entry) =>
          entry.id === selectedEmployee.id
            ? {
                ...entry,
                faceEnrolledAt: null,
              }
            : entry,
        ),
      );
      setMessage(`Face data deleted for ${selectedEmployee.name}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete selected employee face data.";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteEmployee() {
    if (!session?.access_token || !selectedEmployee) {
      return;
    }

    const confirmed = window.confirm(`Delete employee ${selectedEmployee.name}?`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setMessage("");

    try {
      await apiFetch<{ success: boolean }>(`/api/admin/employees/${selectedEmployee.id}`, {
        method: "DELETE",
        accessToken: session.access_token,
      });

      setEmployees((prev) => prev.filter((entry) => entry.id !== selectedEmployee.id));
      setSelectedEmployeeId("");
      setMessage(`Employee deleted: ${selectedEmployee.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete employee.";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !user) {
    return <BrandLoader label="Loading admin enrollment console..." />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <AppHeader role={user.role} email={user.email} active="ADMIN_ENROLL" onSignOut={signOut} />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <CameraPanel videoRef={videoRef} ready={ready} error={cameraError} />

          <section className="glass-card reveal rounded-3xl p-5">
            <h2 className="text-xl font-bold text-[var(--ink-strong)]">Face Enrollment Controls</h2>

            <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-sm">
              <p className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--ink-strong)]">Selected employee face</span>
                <span className={`status-chip ${selectedEmployee?.faceEnrolledAt ? "status-ok" : "status-warn"}`}>
                  {selectedEmployee?.faceEnrolledAt ? "Enrolled" : "Not enrolled"}
                </span>
              </p>
              <p className="text-[var(--ink-soft)]">
                {selectedEmployee?.faceEnrolledAt
                  ? `Last enrolled at ${new Date(selectedEmployee.faceEnrolledAt).toLocaleString()}`
                  : "No embedding saved for selected employee."}
              </p>
              <p className="text-[var(--ink-soft)]">
                <span className="font-semibold text-[var(--ink-strong)]">Liveness challenge:</span> {challengeLabel(challenge)}
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--ink-strong)]">Model status</span>
                <span className={`status-chip ${modelsReady ? "status-ok" : "status-warn"}`}>{modelsReady ? "Loaded" : "Loading"}</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setChallenge(pickRandomChallenge())} className="btn-solid btn-neutral">
                New Challenge
              </button>
              <button type="button" onClick={restart} className="btn-solid btn-neutral">
                Restart Camera
              </button>
              <button
                type="button"
                disabled={!selectedEmployee || !ready || !modelsReady || actionLoading}
                onClick={() => void enrollSelectedEmployeeFace()}
                className="btn-solid btn-main"
              >
                {actionLoading ? "Processing..." : "Capture & Enroll"}
              </button>
              <button
                type="button"
                disabled={!selectedEmployee || actionLoading}
                onClick={() => void clearSelectedEmployeeFace()}
                className="btn-solid btn-danger"
              >
                Delete Face Data
              </button>
            </div>
          </section>
        </div>

        <section className="glass-card reveal space-y-5 rounded-3xl p-5">
          <div>
            <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
              {BRAND_COMPANY}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">Admin Enrollment Console</h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Create employee records, update bio fields, and enroll their face for kiosk use.</p>
          </div>

          <form onSubmit={createEmployee} className="display-card rounded-2xl p-4">
            <h2 className="text-base font-bold text-[var(--ink-strong)]">Add New Employee</h2>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Name</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  required
                  maxLength={100}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Email (optional)</span>
                <input
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  type="email"
                  maxLength={255}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Phone</span>
                <input
                  value={newPhone}
                  onChange={(event) => setNewPhone(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={40}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Department</span>
                <input
                  value={newDepartment}
                  onChange={(event) => setNewDepartment(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={80}
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Title</span>
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={80}
                />
              </label>
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Bio</span>
              <textarea
                value={newBio}
                onChange={(event) => setNewBio(event.target.value)}
                className="h-24 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                maxLength={500}
              />
            </label>

            <button type="submit" disabled={creatingEmployee} className="btn-solid btn-main mt-3">
              {creatingEmployee ? "Creating..." : "Add Employee"}
            </button>
          </form>

          <div className="display-card rounded-2xl p-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[260px] flex-1 text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Select employee</span>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                >
                  {!employees.length && <option value="">No employees found</option>}
                  {employees.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} {entry.email ? `(${entry.email})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" onClick={() => void loadEmployees()} disabled={employeesLoading} className="btn-solid btn-neutral">
                {employeesLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                type="button"
                disabled={!selectedEmployee || actionLoading}
                onClick={() => void deleteEmployee()}
                className="btn-solid btn-danger"
              >
                Delete Employee
              </button>
            </div>
          </div>

          <form onSubmit={saveProfile} className="display-card rounded-2xl p-4">
            <h2 className="text-base font-bold text-[var(--ink-strong)]">Edit Employee Information</h2>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Name</span>
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={100}
                  disabled={!selectedEmployee}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Phone</span>
                <input
                  value={profilePhone}
                  onChange={(event) => setProfilePhone(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={40}
                  disabled={!selectedEmployee}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Department</span>
                <input
                  value={profileDepartment}
                  onChange={(event) => setProfileDepartment(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={80}
                  disabled={!selectedEmployee}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Title</span>
                <input
                  value={profileTitle}
                  onChange={(event) => setProfileTitle(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                  maxLength={80}
                  disabled={!selectedEmployee}
                />
              </label>
            </div>

            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-semibold text-[var(--ink-strong)]">Bio</span>
              <textarea
                value={profileBio}
                onChange={(event) => setProfileBio(event.target.value)}
                className="h-24 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                maxLength={500}
                disabled={!selectedEmployee}
              />
            </label>

            <button type="submit" disabled={!selectedEmployee || savingProfile} className="btn-solid btn-main mt-3">
              {savingProfile ? "Saving..." : "Save Employee Info"}
            </button>
          </form>

          {(error || actionError) && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error || actionError}</p>}
          {message && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        </section>
      </div>
    </main>
  );
}
