"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BrandLoader } from "@/components/brand-loader";
import { useAuthUser } from "@/hooks/use-auth-user";

const adminModules = [
  {
    href: "/admin/enroll",
    label: "Employees",
    detail: "Create employee records, update profiles, and manage face enrollment.",
  },
  {
    href: "/admin/history",
    label: "Records",
    detail: "Review attendance sessions, exports, and exception handling.",
  },
  {
    href: "/admin/devices",
    label: "Terminals",
    detail: "Register kiosks, issue activation tokens, and revoke device access.",
  },
  {
    href: "/admin/violations",
    label: "Alerts",
    detail: "Inspect clocking anomalies, policy failures, and enforcement events.",
  },
  {
    href: "/admin/shifts",
    label: "Shifts",
    detail: "Define schedules, assign staff, and manage daily overrides.",
  },
  {
    href: "/admin/payroll",
    label: "Payroll",
    detail: "Build pay periods, compute summaries, and export payroll-ready data.",
  },
];

export default function AdminHomePage() {
  const { user, loading, signOut } = useAuthUser({ requireAdmin: true });

  if (loading || !user) {
    return <BrandLoader label="Opening control desk..." />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 font-(family-name:--font-lato) text-slate-900 antialiased lg:px-16">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          organizationName={user.organizationName}
          active="ADMIN_HOME"
          onSignOut={signOut}
        />

        <section className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Control Desk
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tighter text-slate-900">
            Everything operational is one click away.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-slate-500">
            Use this hub to move between enrollment, attendance review, device
            management, schedule control, and payroll outputs without guessing
            where a workflow lives.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {adminModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-3xl border-2 border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-900"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Module
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                {module.label}
              </h2>
              <p className="mt-4 text-sm font-bold leading-relaxed text-slate-500">
                {module.detail}
              </p>
              <span className="mt-6 inline-flex text-[10px] font-black uppercase tracking-widest text-slate-900">
                Open module
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
