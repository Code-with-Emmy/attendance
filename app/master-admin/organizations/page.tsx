"use client";

import { useEffect, useState } from "react";
import { Eye, Power, Trash2, ShieldCheck, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type Organization = {
  id: string;
  name: string;
  slug: string;
  employees: number;
  devices: number;
  plan: string;
  status: string;
  created: string;
};

export default function MasterOrganizationsPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrgs() {
      if (!session?.access_token) return;
      try {
        const data = await apiFetch<Organization[]>(
          "/api/master-admin/organizations",
          {
            accessToken: session.access_token,
          },
        );
        setOrgs(data);
      } catch (err) {
        console.error("Failed to fetch orgs", err);
      } finally {
        setLoading(false);
      }
    }
    void loadOrgs();
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
            Organizations
          </h1>
          <p className="text-sm text-slate-400">
            View and manage all tenant organizations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="h-9 w-64 rounded-md border border-slate-800 bg-slate-900/50 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <button className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden backdrop-blur-xl shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950/40 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Organization</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Employees</th>
                <th className="px-6 py-4 font-bold">Devices</th>
                <th className="px-6 py-4 font-bold">Plan</th>
                <th className="px-6 py-4 font-bold">Status</th>
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
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500 mb-3" />
                      Loading organizations...
                    </div>
                  </td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                orgs.map((org, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={org.id}
                    className="group transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      {org.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
                      {org.slug}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {org.employees}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{org.devices}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-300 border border-slate-700">
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          org.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${org.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                        />
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3 text-slate-500">
                      <button
                        className="hover:text-cyan-400 transition"
                        title="View"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      {org.status === "Suspended" ? (
                        <button
                          className="hover:text-emerald-400 transition"
                          title="Activate"
                        >
                          <ShieldCheck className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <button
                          className="hover:text-amber-500 transition"
                          title="Suspend"
                        >
                          <Power className="h-4.5 w-4.5" />
                        </button>
                      )}
                      <button
                        className="hover:text-rose-500 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
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
