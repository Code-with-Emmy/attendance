"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  MonitorSmartphone,
  Activity,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type MasterStats = {
  totalOrganizations: { value: number; change: string };
  activeSubscriptions: { value: number; change: string };
  registeredKiosks: { value: number; change: string };
  clockEventsToday: { value: number; change: string };
};

export default function MasterDashboardPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [stats, setStats] = useState<MasterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!session?.access_token) return;
      try {
        const data = await apiFetch<MasterStats>("/api/master-admin/stats", {
          accessToken: session.access_token,
        });
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch master stats", err);
      } finally {
        setLoading(false);
      }
    }
    void loadStats();
  }, [session]);

  const cards = [
    {
      label: "Total Organizations",
      data: stats?.totalOrganizations,
      icon: Building2,
    },
    {
      label: "Active Subscriptions",
      data: stats?.activeSubscriptions,
      icon: Users,
    },
    {
      label: "Registered Kiosks",
      data: stats?.registeredKiosks,
      icon: MonitorSmartphone,
    },
    {
      label: "Clock Events Today",
      data: stats?.clockEventsToday,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Platform Overview
        </h1>
        <p className="text-slate-400">
          High-level metrics across all organizations and devices.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            key={item.label}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl transition hover:border-slate-700 hover:bg-slate-900/60"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </span>
              <div className="rounded-lg bg-slate-800/80 p-2.5 text-blue-400 ring-1 ring-white/5 transition group-hover:bg-blue-500/10 group-hover:text-blue-300">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="relative flex items-end gap-3 mt-auto">
              {loading ? (
                <div className="h-10 w-24 animate-pulse rounded bg-slate-800" />
              ) : (
                <span className="text-4xl font-black tracking-tight text-white">
                  {item.data?.value ?? 0}
                </span>
              )}
            </div>
            <div className="relative mt-3">
              {loading ? (
                <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
              ) : (
                <p className="text-xs font-bold tracking-wide text-emerald-400">
                  {item.data?.change ?? "+0"}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
      >
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-between min-h-[300px] hover:border-slate-700 transition">
          <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          <h3 className="text-lg font-bold text-white mb-2">
            Platform Throughput
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest border border-slate-800 px-4 py-2 rounded-full backdrop-blur-sm bg-slate-900/50 flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Awaiting Analytics Engine
            </span>
          </div>
          <button className="text-sm font-semibold text-blue-400 mt-4 flex items-center gap-1 hover:text-blue-300 transition w-max">
            View Analytics <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-between min-h-[300px] hover:border-slate-700 transition">
          <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-rose-500/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          <h3 className="text-lg font-bold text-white mb-2">
            Critical Security Events
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest border border-slate-800 px-4 py-2 rounded-full backdrop-blur-sm bg-slate-900/50 flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Feed Connected
            </span>
          </div>
          <button className="text-sm font-semibold text-rose-400 mt-4 flex items-center gap-1 hover:text-rose-300 transition w-max">
            Open Audit Trail <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
