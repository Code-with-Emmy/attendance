"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Lock,
  Trash2,
  PlusCircle,
  Save,
  Loader2,
  Key,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";

type WhitelistEntry = {
  id: string;
  email: string;
  role: string;
};

type SecretSummary = {
  key: string;
  description: string | null;
  updatedAt: string;
};

export default function MasterSettingsPage() {
  const { session } = useAuthUser({ requireMasterAdmin: true });
  const [data, setData] = useState<{
    whitelist: WhitelistEntry[];
    secrets: SecretSummary[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingWhitelist, setSavingWhitelist] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("ADMIN");
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [newSecretDesc, setNewSecretDesc] = useState("");

  const loadData = async () => {
    if (!session?.access_token) return;
    try {
      const result = await apiFetch<{
        whitelist: WhitelistEntry[];
        secrets: SecretSummary[];
      }>("/api/master-admin/settings", { accessToken: session.access_token });
      setData(result);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [session]);

  const addWhitelist = async () => {
    if (!newEmail.trim() || !session?.access_token) return;
    setSavingWhitelist(true);
    try {
      await apiFetch("/api/master-admin/settings", {
        method: "POST",
        accessToken: session.access_token,
        body: { type: "whitelist", email: newEmail, role: newRole },
      });
      setNewEmail("");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add email");
    } finally {
      setSavingWhitelist(false);
    }
  };

  const removeWhitelist = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await apiFetch(`/api/master-admin/settings?id=${id}`, {
        method: "DELETE",
        accessToken: session.access_token,
      });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const addSecret = async () => {
    if (
      !newSecretKey.trim() ||
      !newSecretValue.trim() ||
      !session?.access_token
    )
      return;
    setSavingSecret(true);
    try {
      await apiFetch("/api/master-admin/settings", {
        method: "POST",
        accessToken: session.access_token,
        body: {
          type: "secret",
          key: newSecretKey,
          value: newSecretValue,
          description: newSecretDesc,
        },
      });
      setNewSecretKey("");
      setNewSecretValue("");
      setNewSecretDesc("");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save secret");
    } finally {
      setSavingSecret(false);
    }
  };

  const deleteSecret = async (key: string) => {
    if (!session?.access_token) return;
    try {
      await apiFetch(`/api/master-admin/settings?key=${key}`, {
        method: "DELETE",
        accessToken: session.access_token,
      });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete secret");
    }
  };

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          Platform Configuration
        </h1>
        <p className="text-sm text-slate-400">
          Manage global whitelists and application secrets stored in the
          database.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Whitelist Management */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="site-card rounded-4xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Whitelist</h2>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="name@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-rose-500"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MASTER_ADMIN">MASTER_ADMIN</option>
                <option value="ORG_ADMIN">ORG_ADMIN</option>
              </select>
              <button
                onClick={addWhitelist}
                disabled={savingWhitelist || !newEmail}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition disabled:opacity-50"
              >
                {savingWhitelist ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Loading whitelist...
              </div>
            ) : data?.whitelist.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
                No emails whitelisted.
              </div>
            ) : (
              data?.whitelist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {entry.email}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      {entry.role}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWhitelist(entry.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.section>

        {/* Global Secrets */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="site-card rounded-4xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Platform Secrets</h2>
          </div>

          <div className="space-y-3 mb-8">
            <input
              type="text"
              placeholder="Secret Key (e.g. STRIPE_SECRET_KEY)"
              value={newSecretKey}
              onChange={(e) => setNewSecretKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Value"
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addSecret}
                disabled={savingSecret || !newSecretKey || !newSecretValue}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50"
              >
                {savingSecret ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
              </button>
            </div>
            <input
              type="text"
              placeholder="Description (Internal use only)"
              value={newSecretDesc}
              onChange={(e) => setNewSecretDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] text-slate-400 placeholder-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Loading secrets...
              </div>
            ) : data?.secrets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
                No database-stored secrets.
              </div>
            ) : (
              data?.secrets.map((sec) => (
                <div
                  key={sec.key}
                  className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3 text-blue-400" />
                      <p className="text-sm font-bold text-white truncate">
                        {sec.key}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {sec.description || "No description"}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSecret(sec.key)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
