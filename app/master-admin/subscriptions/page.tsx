"use client";

import { useEffect, useState } from "react";
import { CreditCard, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type Subscription = {
  id: string;
  org: string;
  plan: string;
  status: string;
  periodEnd: string;
  employees: number;
  devices: number;
};

export default function MasterSubscriptionsPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubs() {
      if (!session?.access_token) return;
      try {
        const data = await apiFetch<Subscription[]>(
          "/api/master-admin/subscriptions",
          {
            accessToken: session.access_token,
          },
        );
        setSubs(data);
      } catch (err) {
        console.error("Failed to fetch subs", err);
      } finally {
        setLoading(false);
      }
    }
    void loadSubs();
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
            Subscriptions
          </h1>
          <p className="text-sm text-slate-400">
            Monitor billing plans and device quotas.
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
                <th className="px-6 py-4 font-bold">Organization</th>
                <th className="px-6 py-4 font-bold">Plan</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Period End</th>
                <th className="px-6 py-4 font-bold">Employees Count</th>
                <th className="px-6 py-4 font-bold">Devices Count</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500 mb-3" />
                      Loading subscriptions...
                    </div>
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subs.map((sub, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={sub.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      {sub.org}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          sub.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${sub.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {sub.periodEnd}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {sub.employees}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{sub.devices}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-slate-300 transition">
                        <MoreVertical className="h-4.5 w-4.5 ml-auto" />
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
