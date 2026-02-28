"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BRAND_COMPANY } from "@/lib/branding";

export default function AdminLoginPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("System config error. Contact administrator.");
      return;
    }
    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/admin/enroll");
      }
    });
  }, [router, supabase]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("The login system is offline.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.replace("/admin/enroll");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Check your details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) antialiased text-slate-900 flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-white border-2 border-slate-200 rounded-xl p-10 md:p-12 shadow-sm relative overflow-hidden">
        <div className="flex flex-col items-center text-center mb-10">
          {/* Plain Brand Mark */}
          <div className="h-16 w-16 mb-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <span className="font-black text-3xl text-white tracking-tighter">
              A
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 mb-2">
              {BRAND_COMPANY} Access
            </p>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
              Admin Entry.
            </h1>
            <p className="max-w-xs mx-auto text-[10px] font-black uppercase tracking-widest text-slate-400">
              Secure portal for system managers
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-6">
            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Email Address
              </span>
              <input
                className="w-full h-12 bg-slate-50 border-2 border-slate-200 rounded-lg px-5 text-md font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Manager email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Security Password
              </span>
              <input
                className="w-full h-12 bg-slate-50 border-2 border-slate-200 rounded-lg px-5 text-md font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access key"
                minLength={6}
                required
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-600 text-white border-2 border-rose-400 text-[10px] font-black uppercase tracking-widest">
              <span>!</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-30"
          >
            {loading ? "Authenticating..." : "Open Control Desk"}
          </button>

          <Link
            href="/"
            className="group flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all mt-10 pt-8 border-t border-slate-100"
          >
            <svg
              className="h-3 w-3 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Kiosk
          </Link>
        </form>
      </section>
    </main>
  );
}
