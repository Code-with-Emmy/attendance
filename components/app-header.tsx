"use client";

import Link from "next/link";
import { ArrowRight, Building2, LogOut, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  role:
    | "USER"
    | "ADMIN"
    | "MASTER_ADMIN"
    | "ORG_ADMIN"
    | "HR"
    | "MANAGER"
    | "VIEWER";
  email: string;
  organizationName?: string;
  active:
    | "ADMIN_HOME"
    | "ATTENDANCE"
    | "ADMIN_HISTORY"
    | "ADMIN_ENROLL"
    | "ADMIN_DEVICES"
    | "ADMIN_VIOLATIONS"
    | "ADMIN_SHIFTS"
    | "ADMIN_PAYROLL";
  onSignOut: () => Promise<void> | void;
};

function linkClass(isActive: boolean) {
  return [
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.22em] transition-all",
    isActive
      ? "border border-blue-400/30 bg-blue-500/16 text-blue-100 shadow-[0_14px_34px_rgba(37,99,235,0.2)]"
      : "border border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/24 hover:bg-white/8 hover:text-white",
  ].join(" ");
}

export function AppHeader({
  role,
  email,
  organizationName = "Default Organization",
  active,
  onSignOut,
}: Props) {
  const isAdmin = ["ADMIN", "MASTER_ADMIN", "ORG_ADMIN"].includes(role);

  return (
    <header className="site-card relative mb-6 overflow-hidden rounded-4xl px-4 py-4 sm:mb-10 sm:px-6 sm:py-6 lg:px-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_6%,rgba(59,130,246,0.34)_36%,rgba(34,197,94,0.16)_62%,transparent_94%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%)]" />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between sm:gap-5">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.34)] sm:p-3.5">
              <BrandLogo
                size="sm"
                className="h-8 w-8 sm:h-11 sm:w-11 md:h-12 md:w-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.34em] text-slate-400">
                  AttendanceKiosk
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em] text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isAdmin ? "Admin Control" : "Secure Access"}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl md:text-[2rem]">
                {organizationName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium">
                  <Building2 className="h-4 w-4 text-blue-300" />
                  {email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/kiosk"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-100 transition hover:border-blue-400/24 hover:bg-white/8 sm:h-11"
            >
              Open Kiosk
              <ArrowRight className="h-4 w-4 text-blue-300" />
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-red-400/18 bg-red-500/10 px-4 text-[0.68rem] font-black uppercase tracking-[0.22em] text-red-200 transition hover:bg-red-500/16 sm:h-11"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        <nav className="flex snap-x overflow-x-auto pb-2 scrollbar-hide flex-nowrap items-center gap-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {isAdmin && (
            <Link href="/admin" className={linkClass(active === "ADMIN_HOME")}>
              Overview
            </Link>
          )}
          <Link href="/kiosk" className={linkClass(active === "ATTENDANCE")}>
            Kiosk
          </Link>
          {isAdmin && (
            <Link
              href="/admin/enroll"
              className={linkClass(active === "ADMIN_ENROLL")}
            >
              Employees
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/history"
              className={linkClass(active === "ADMIN_HISTORY")}
            >
              Records
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/devices"
              className={linkClass(active === "ADMIN_DEVICES")}
            >
              Terminals
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/violations"
              className={linkClass(active === "ADMIN_VIOLATIONS")}
            >
              Alerts
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/shifts"
              className={linkClass(active === "ADMIN_SHIFTS")}
            >
              Shifts
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/payroll"
              className={linkClass(active === "ADMIN_PAYROLL")}
            >
              Payroll
            </Link>
          )}
          {role === "MASTER_ADMIN" && (
            <Link href="/master-admin" className={linkClass(false)}>
              Platform
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
