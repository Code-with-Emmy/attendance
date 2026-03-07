"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useAuthUser } from "@/hooks/use-auth-user";
import { apiFetch } from "@/lib/client/api";
import { BrandLoader } from "@/components/brand-loader";

type Device = {
  id: string;
  name: string;
  lastActiveAt: string | null;
  createdAt: string;
};

export default function AdminDevicesPage() {
  const { user, session, loading, signOut } = useAuthUser({
    requireAdmin: true,
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activationToken, setActivationToken] = useState("");

  const loadDevices = useCallback(async () => {
    if (!session?.access_token) return;

    setDevicesLoading(true);
    setError("");

    try {
      const data = await apiFetch<Device[]>("/api/admin/devices", {
        method: "GET",
        accessToken: session.access_token,
      });
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load devices.");
    } finally {
      setDevicesLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.access_token || !newDeviceName.trim()) return;

    setCreating(true);
    setError("");
    setMessage("");
    setActivationToken("");

    try {
      const response = await apiFetch<{
        success: boolean;
        device: Device;
        activationToken: string;
      }>(
        "/api/admin/devices",
        {
          method: "POST",
          accessToken: session.access_token,
          body: JSON.stringify({ name: newDeviceName }),
        }
      );

      setDevices((prev) => [response.device, ...prev]);
      setNewDeviceName("");
      setActivationToken(response.activationToken);
      setMessage("Device registered. Copy the activation token now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create device.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteDevice(id: string, name: string) {
    if (!session?.access_token) return;
    if (!confirm(`Revoke access for ${name}? This device will no longer be able to clock in/out.`)) return;

    setError("");
    setMessage("");

    try {
      await apiFetch<{ success: boolean }>(`/api/admin/devices/${id}`, {
        method: "DELETE",
        accessToken: session.access_token,
      });
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setMessage("Device revoked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke device.");
    }
  }

  if (loading || !user) {
    return <BrandLoader label="Opening device manager..." />;
  }

  return (
    <main className="admin-shell admin-theme min-h-screen font-(family-name:--font-lato) antialiased text-slate-100 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          organizationName={user.organizationName}
          active="ADMIN_DEVICES"
          onSignOut={signOut}
        />

        <header className="mb-12 border-l-4 border-slate-900 pl-6 space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
            Kiosk Terminals.
          </h1>
          <p className="text-md font-bold text-slate-500 max-w-xl">
            Register and manage dedicated devices for site attendance. Each device needs a unique token to authenticate.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-12 space-y-10">
            {/* New Device Form */}
            <section className="bg-white border-2 border-slate-200 p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-8">
                Register New Terminal
              </h2>
              <form onSubmit={createDevice} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Terminal Name (e.g. Main Lobby, Warehouse Entrance)
                  </label>
                  <input
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="Enter terminal name..."
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 px-5 rounded-lg text-lg font-bold text-slate-900 outline-none focus:border-slate-900 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !newDeviceName.trim()}
                  className="h-12 md:mt-5 px-8 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
                >
                  {creating ? "Generating..." : "Generate Token"}
                </button>
              </form>
              {activationToken && (
                <div className="mt-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        One-time activation token
                      </p>
                      <p className="text-sm font-bold text-emerald-900">
                        Save this now. For security, it will not be shown again.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(activationToken)}
                      className="h-11 px-5 rounded-lg bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                    >
                      Copy Token
                    </button>
                  </div>
                  <code className="mt-4 block break-all rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-700">
                    {activationToken}
                  </code>
                </div>
              )}
            </section>

            {/* Device List */}
            <section className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Active Terminals
                </h2>
                <button
                  onClick={() => void loadDevices()}
                  disabled={devicesLoading}
                  className="h-10 px-4 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <svg
                    className={`h-4 w-4 ${devicesLoading ? "animate-spin text-slate-900" : "opacity-30"}`}
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
                  Sync
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Access</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Active</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {devices.length === 0 && !devicesLoading && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                          No terminals registered yet.
                        </td>
                      </tr>
                    )}
                    {devices.map((device) => (
                      <tr key={device.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-lg font-black text-slate-900 tracking-tight">{device.name}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Hidden after setup
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-bold text-slate-500 tracking-tight">
                            {device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleString() : "Never"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => deleteDevice(device.id, device.name)}
                            className="h-10 px-4 rounded-md border border-rose-100 text-[10px] font-black text-rose-300 uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(error || message) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-4 px-8 py-4 rounded-xl border-2 shadow-2xl ${
              error
                ? "bg-rose-600 text-white border-rose-400"
                : "bg-emerald-600 text-white border-emerald-400"
            }`}
          >
            <span className="text-2xl font-black">
              {error ? "!" : "✓"}
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest">
              {error || message}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
