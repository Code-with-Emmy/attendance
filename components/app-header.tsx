"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  role: "USER" | "ADMIN";
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
    "rounded-md px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "bg-white border border-slate-300 text-slate-500 hover:bg-slate-100",
  ].join(" ");
}

export function AppHeader({
  role,
  email,
  organizationName = "Default Organization",
  active,
  onSignOut,
}: Props) {
  return (
    <header className="mb-12 border-2 border-slate-200 bg-white p-6 rounded-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <BrandLogo size="sm" className="h-11 w-11 md:h-14 md:w-14" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {organizationName} &middot; {email}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {role === "ADMIN" && (
            <Link href="/admin" className={linkClass(active === "ADMIN_HOME")}>
              Overview
            </Link>
          )}
          <Link href="/kiosk" className={linkClass(active === "ATTENDANCE")}>
            Kiosk
          </Link>
          {role === "ADMIN" && (
            <Link
              href="/admin/enroll"
              className={linkClass(active === "ADMIN_ENROLL")}
            >
              Employees
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/history"
              className={linkClass(active === "ADMIN_HISTORY")}
            >
              Records
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/devices"
              className={linkClass(active === "ADMIN_DEVICES")}
            >
              Terminals
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/violations"
              className={linkClass(active === "ADMIN_VIOLATIONS")}
            >
              Alerts
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/shifts"
              className={linkClass(active === "ADMIN_SHIFTS")}
            >
              Shifts
            </Link>
          )}
          {role === "ADMIN" && (
            <Link
              href="/admin/payroll"
              className={linkClass(active === "ADMIN_PAYROLL")}
            >
              Payroll
            </Link>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md border border-rose-200 bg-white px-6 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
