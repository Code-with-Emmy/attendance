"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type Device = {
  id: string;
  name: string;
  org: string;
  lastSeen: string;
  status: string;
  location: string;
};

export default function MasterDevicesPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevices() {
      if (!session?.access_token) return;
      try {
        const data = await apiFetch<Device[]>("/api/master-admin/devices", {
          accessToken: session.access_token,
        });
        setDevices(data);
      } catch (err) {
        console.error("Failed to fetch devices", err);
      } finally {
        setLoading(false);
      }
    }
    void loadDevices();
  }, [session]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            Registered Kiosks
          </h1>
          <p className="text-sm text-slate-400">
            Manage device terminals across all organizations.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950/40 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Device Name</th>
                <th className="px-6 py-4 font-bold">Organization</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 font-bold">Last Seen</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500 mb-3" />
                      Loading devices...
                    </div>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No devices found.
                  </td>
                </tr>
              ) : (
                devices.map((device, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={device.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                      <MonitorSmartphone className="h-4.5 w-4.5 text-blue-400" />
                      {device.name}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{device.org}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {device.location}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {device.lastSeen}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          device.status === "Online"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${device.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                        />
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-cyan-400 transition">
                        <MoreHorizontal className="h-4.5 w-4.5 ml-auto" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
