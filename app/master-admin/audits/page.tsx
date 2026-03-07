"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type AuditEvent = {
  id: string;
  type: string;
  user: string;
  org: string;
  event: string;
  time: string;
  ip: string;
};

export default function MasterAuditsPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudits() {
      if (!session?.access_token) return;
      try {
        const data = await apiFetch<AuditEvent[]>("/api/master-admin/audits", {
          accessToken: session.access_token,
        });
        setAudits(data);
      } catch (err) {
        console.error("Failed to fetch audits", err);
      } finally {
        setLoading(false);
      }
    }
    void loadAudits();
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
            Audit Logs
          </h1>
          <p className="text-sm text-slate-400">
            Security events and platform operations trail.
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
          <table className="min-w-full divide-y divide-slate-800/80">
            <thead className="bg-slate-800/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                  Event
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                  Organization
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                >
                  IP Address
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-rose-500 mb-3" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No logs found.
                  </td>
                </tr>
              ) : (
                audits.map((log, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={log.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-md p-2 ${
                            log.type === "security" || log.type === "anomaly"
                              ? "bg-rose-500/10 text-rose-400"
                              : log.type === "device"
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {log.type === "login" ? (
                            <LogIn className="h-4.5 w-4.5" />
                          ) : log.type === "security" ||
                            log.type === "anomaly" ? (
                            <ShieldAlert className="h-4.5 w-4.5" />
                          ) : log.type === "device" ? (
                            <Activity className="h-4.5 w-4.5" />
                          ) : (
                            <UserPlus className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {log.event}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {log.time}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {log.org}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.user}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition">
                        View Details
                      </span>
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
