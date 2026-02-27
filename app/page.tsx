"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BRAND_COMPANY, BRAND_PRODUCT } from "@/lib/branding";

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/admin/enroll");
      }
    });
  }, [router, supabase.auth]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      router.replace("/admin/enroll");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 lg:px-6">
      <section className="glass-card reveal grid gap-8 rounded-[2rem] p-6 md:p-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
            {BRAND_COMPANY}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--ink-strong)] md:text-5xl">
            {BRAND_PRODUCT}
            <span className="block text-2xl font-semibold text-[var(--ink-soft)] md:text-3xl">Professional Face Attendance Platform</span>
          </h1>
          <p className="max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">
            Employees do not use app accounts. Admin manages employee details and face enrollment, then staff use the office kiosk for
            liveness + face clock in/out.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/attendance" className="display-card rounded-2xl p-4 text-sm transition hover:-translate-y-0.5">
              <p className="font-bold text-[var(--ink-strong)]">/attendance</p>
              <p className="mt-1 text-[var(--ink-soft)]">Kiosk mode</p>
            </Link>
            <Link href="/admin/enroll" className="display-card rounded-2xl p-4 text-sm transition hover:-translate-y-0.5">
              <p className="font-bold text-[var(--ink-strong)]">/admin/enroll</p>
              <p className="mt-1 text-[var(--ink-soft)]">Employees</p>
            </Link>
            <Link href="/admin/history" className="display-card rounded-2xl p-4 text-sm transition hover:-translate-y-0.5">
              <p className="font-bold text-[var(--ink-strong)]">/admin/history</p>
              <p className="mt-1 text-[var(--ink-soft)]">Audit + Export</p>
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmit} className="display-card rounded-3xl p-6 md:p-7">
          <h2 className="text-2xl font-bold text-[var(--ink-strong)]">Admin Sign In</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Use your admin credentials to manage employees and attendance records.</p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-[var(--ink-strong)]">Email</span>
              <input
                className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-[var(--ink-strong)] outline-none transition focus:border-cyan-500"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold text-[var(--ink-strong)]">Password</span>
              <input
                className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-[var(--ink-strong)] outline-none transition focus:border-cyan-500"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                required
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={loading} className="btn-solid btn-main mt-5 w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
