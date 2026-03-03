"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { apiFetch } from "@/lib/client/api";
import { useAuthUser } from "@/hooks/use-auth-user";
import { BrandLoader } from "@/components/brand-loader";

type ViolationRow = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  meta: any;
  employee: {
    id: string;
    name: string;
    email: string | null;
  };
};

export default function ViolationsPage() {
  const { user, loading, session, signOut } = useAuthUser({
    requireAdmin: true,
  });
  const [violations, setViolations] = useState<ViolationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchViolations = async () => {
    if (!session?.access_token) return;
    try {
      setIsLoading(true);
      const data = await apiFetch<ViolationRow[]>("/api/admin/violations", {
        accessToken: session.access_token,
      });
      setViolations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load violations.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchViolations();
  }, [session?.access_token]);

  if (loading || !user) {
    return <BrandLoader label="Scanning for violations..." />;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 px-6 py-10 lg:px-16 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          active="ADMIN_VIOLATIONS"
          onSignOut={signOut}
        />

        <header className="mb-12 border-l-4 border-rose-500 pl-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">
              Rule Violations.
            </h1>
            <p className="text-md font-bold text-slate-500 max-w-xl">
              Audit rejected clock attempts and system alerts.
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-rose-100 border-2 border-rose-200 text-rose-600 rounded-xl font-bold">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : violations.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">
              No violations found.
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Violation Type</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {violations.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-rose-50/10 transition-colors"
                    >
                      <td className="py-5 px-6">
                        <p className="text-sm font-black text-slate-900">
                          {v.employee.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {v.employee.email}
                        </p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                          {v.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-xs font-bold text-slate-600 italic">
                          "{v.message}"
                        </p>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-xs font-black text-slate-900">
                          {new Date(v.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
