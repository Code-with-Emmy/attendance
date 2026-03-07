"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Authentication service is unavailable.");
      return;
    }

    setSupabase(client);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/admin");
      }
    });
  }, [router, supabase]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError("Authentication service is unavailable.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.replace("/admin");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="site-card rounded-4xl p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <BrandLogo size="md" className="h-12 w-12" />
              </div>
              <div>
                <p className="section-label">Admin Login</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
                  Open the control desk
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
              Sign in as an administrator to manage kiosks, employee records,
              attendance history, and payroll-ready reports.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-4xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  Restricted access
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Only approved administrators should have credentials for this
                  operational surface.
                </p>
              </div>
              <div className="rounded-4xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  Live attendance oversight
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Review events, devices, locations, and exports from one place.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="site-card rounded-4xl p-8 sm:p-10"
          >
            <p className="section-label">Authentication</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Manager credentials
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Use the same admin email and password issued for the operational
              console.
            </p>

            <div className="mt-7 space-y-5">
              <label>
                <span className="label-text">Email</span>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@company.com"
                  required
                />
              </label>

              <label>
                <span className="label-text">Password</span>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border border-white/10 bg-slate-900 text-blue-500"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-300 hover:text-blue-200"
              >
                Forgot password?
              </Link>
            </div>

            {error ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="cta-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Login"}
            </button>

            <div className="surface-divider mt-7 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-300" />
                Protected by role-based access, verified sessions, and
                device-aware admin controls.
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to site
              </Link>
            </div>
          </form>
        </div>
      </section>
    </PublicSiteShell>
  );
}
