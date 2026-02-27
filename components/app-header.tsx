"use client";

import Link from "next/link";
import { BRAND_COMPANY, BRAND_PRODUCT } from "@/lib/branding";

type Props = {
  role: "USER" | "ADMIN";
  email: string;
  active: "ATTENDANCE" | "ADMIN_HISTORY" | "ADMIN_ENROLL";
  onSignOut: () => Promise<void> | void;
};

function linkClass(isActive: boolean) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "border border-transparent bg-[linear-gradient(135deg,#0066ff,#0f5fd8)] text-white shadow-[0_8px_16px_rgba(0,102,255,0.25)]"
      : "border border-[var(--line)] bg-white text-[var(--ink-strong)] hover:bg-slate-50",
  ].join(" ");
}

export function AppHeader({ role, email, active, onSignOut }: Props) {
  return (
    <header className="glass-card reveal mb-6 rounded-3xl p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">{BRAND_COMPANY}</p>
          <p className="text-sm font-semibold text-[var(--ink-strong)]">{BRAND_PRODUCT}</p>
          <p className="text-sm text-[var(--ink-soft)]">Signed in as {email}</p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <Link href="/attendance" className={linkClass(active === "ATTENDANCE")}>
            Kiosk
          </Link>
          {role === "ADMIN" && (
            <Link href="/admin/enroll" className={linkClass(active === "ADMIN_ENROLL")}>
              Employees
            </Link>
          )}
          {role === "ADMIN" && (
            <Link href="/admin/history" className={linkClass(active === "ADMIN_HISTORY")}>
              Admin History
            </Link>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
