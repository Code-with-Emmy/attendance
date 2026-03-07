"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  MonitorSmartphone,
  ShieldAlert,
  LogOut,
  Server,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { MasterAdminProxy } from "./proxy";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/master-admin", icon: LayoutDashboard },
  {
    label: "Organizations",
    href: "/master-admin/organizations",
    icon: Building2,
  },
  {
    label: "Subscriptions",
    href: "/master-admin/subscriptions",
    icon: CreditCard,
  },
  { label: "Users", href: "/master-admin/users", icon: Users },
  { label: "Devices", href: "/master-admin/devices", icon: MonitorSmartphone },
  { label: "Audit Logs", href: "/master-admin/audits", icon: ShieldAlert },
  { label: "System Settings", href: "/master-admin/settings", icon: Server },
];

function MasterAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuthUser();

  return (
    <div className="admin-shell admin-theme flex min-h-screen text-slate-50 font-sans antialiased">
      {/* Sidebar */}
      <aside className="site-card fixed inset-y-4 left-4 z-20 flex w-64 flex-col rounded-4xl border border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="flex h-18 items-center gap-3 border-b border-white/8 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/16 text-blue-100">
            <Server className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-[0.24em] text-white uppercase">
            Platform Admin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-blue-400/22 bg-blue-500/14 text-blue-100"
                    : "border border-transparent text-slate-400 hover:border-white/8 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-red-400/14 hover:bg-red-500/10 hover:text-rose-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-10 mx-4 mt-4 flex h-18 items-center justify-between rounded-[1.75rem] border border-white/8 bg-slate-950/64 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

export default function MasterAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MasterAdminProxy>
      <MasterAdminLayoutInner>{children}</MasterAdminLayoutInner>
    </MasterAdminProxy>
  );
}
