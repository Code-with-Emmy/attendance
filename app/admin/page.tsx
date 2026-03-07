"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Clock3,
  FileSpreadsheet,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BrandLoader } from "@/components/brand-loader";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ProductBackdrop } from "@/components/ProductBackdrop";

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
    <main className="admin-shell admin-theme relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 antialiased sm:px-6 sm:py-8 lg:px-10">
      <ProductBackdrop />
      <div className="relative mx-auto max-w-7xl">
        <AppHeader
          role={user.role}
          email={user.email}
          organizationName={user.organizationName}
          active="ADMIN_HOME"
          onSignOut={signOut}
        />

        <section className="site-card rounded-[2rem] px-4 py-5 sm:px-8 sm:py-8">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-slate-400">
            Control Desk
          </p>
          <h1 className="mt-2 max-w-4xl text-2xl font-black tracking-tight text-white sm:mt-3 sm:text-4xl lg:text-5xl">
            Operations, attendance, devices, and payroll in one unified
            workspace.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-400">
            Use this hub to move between enrollment, attendance review, device
            management, schedule control, and payroll outputs without guessing
            where a workflow lives.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)] sm:px-5 sm:py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-blue-400/18 bg-blue-500/10 text-blue-300">
                <Users2 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight text-white">
                Employee readiness
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                Capture profiles, enroll faces, and maintain department and role
                metadata.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)] sm:px-5 sm:py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-emerald-400/18 bg-emerald-400/10 text-emerald-300">
                <Camera className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight text-white">
                Kiosk governance
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                Activate hardware, monitor kiosk access, and keep trusted
                devices aligned.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)] sm:px-5 sm:py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-amber-400/18 bg-amber-400/10 text-amber-300">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight text-white">
                Payroll outputs
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-400">
                Review work sessions, exceptions, and payroll-ready summaries
                from the same system.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {adminModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="site-card group rounded-[1.8rem] px-4 py-5 transition hover:-translate-y-1 hover:border-blue-400/28 sm:px-6 sm:py-6"
            >
              <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-slate-400">
                Module
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl">
                {module.label}
              </h2>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-400">
                {module.detail}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-white">
                Open module
                <ArrowRight className="h-4 w-4 text-blue-300 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-3">
          <div className="site-card rounded-[1.8rem] px-4 py-5 sm:px-6 sm:py-6">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h3 className="mt-4 text-xl font-black tracking-tight text-white">
              Trusted admin workflows
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-400">
              The control desk is structured for enrollment, attendance review,
              device operations, and enforcement.
            </p>
          </div>
          <div className="site-card rounded-[1.8rem] px-4 py-5 sm:px-6 sm:py-6">
            <Clock3 className="h-5 w-5 text-blue-300" />
            <h3 className="mt-4 text-xl font-black tracking-tight text-white">
              Real-time operational cadence
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-400">
              Move from kiosk activity to exports and exception handling without
              leaving the admin surface.
            </p>
          </div>
          <div className="site-card rounded-[1.8rem] px-4 py-5 sm:px-6 sm:py-6">
            <FileSpreadsheet className="h-5 w-5 text-amber-300" />
            <h3 className="mt-4 text-xl font-black tracking-tight text-white">
              Reporting-ready outputs
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-400">
              Attendance data stays positioned for payroll review, audit
              workflows, and downstream reporting.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
