"use client";

import { useEffect, useState } from "react";
import { Shield, MoreHorizontal, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string;
  status: string;
};

export default function MasterUsersPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!session?.access_token) return;
    try {
      const data = await apiFetch<AdminUser[]>(
        `/api/master-admin/users?q=${encodeURIComponent(search)}`,
        {
          accessToken: session.access_token,
        },
      );
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [session, search]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!session?.access_token) return;
    setUpdating(userId);
    try {
      await apiFetch(`/api/master-admin/users`, {
        method: "PUT",
        accessToken: session.access_token,
        body: { id: userId, role: newRole },
      });
      await loadUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      alert(msg);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            Administrative Users
          </h1>
          <p className="text-sm text-slate-400">
            View MASTER_ADMIN and ORG_ADMIN accounts.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900/50 px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          </div>
          <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
            <UserCog className="h-4.5 w-4.5" />
            Invite Admin
          </button>
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
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Organization</th>
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
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500 mb-3" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                          user.role === "MASTER_ADMIN"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {user.org}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          user.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${user.status === "Active" ? "bg-emerald-500" : "bg-slate-500"}`}
                        />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        disabled={updating === user.id}
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.id, e.target.value)
                        }
                        className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MASTER_ADMIN">MASTER_ADMIN</option>
                        <option value="ORG_ADMIN">ORG_ADMIN</option>
                      </select>
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
