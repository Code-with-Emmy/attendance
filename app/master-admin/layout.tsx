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
      <aside className="site-card fixed inset-y-4 left-4 z-20 flex w-64 flex-col rounded-4xl border border-[#d8c6a8]/10 bg-[#041236]/80 backdrop-blur-xl">
        <div className="flex h-18 items-center gap-3 border-b border-[#d8c6a8]/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center bg-[#E67300]/14 text-[#ffd7ab]">
            <Server className="h-4 w-4 text-current" />
          </div>
          <span className="text-sm font-black tracking-[0.24em] text-white uppercase">
            Platform Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-[0.08em] transition-colors ${
                  isActive
                    ? "border border-[#E67300]/22 bg-[#E67300]/12 text-[#fff1dd]"
                    : "border border-transparent text-[#d7c5a4] hover:border-[#d8c6a8]/10 hover:bg-white/5 hover:text-[#fff1dd]"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#d8c6a8]/10 p-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 border border-transparent px-3 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#d7c5a4] transition-colors hover:border-red-400/14 hover:bg-red-500/10 hover:text-rose-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-72">
        <header className="sticky top-0 z-10 mx-4 mt-4 flex h-18 items-center justify-between rounded-[1.75rem] border border-[#d8c6a8]/10 bg-[#041236]/72 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4 text-sm font-medium text-[#d7c5a4]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#E67300]" />
              Systems Operational
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-[#f8f0e3]">{user?.name}</p>
              <p className="text-xs uppercase tracking-wider text-[#d7c5a4]">
                {user?.role}
              </p>
            </div>
          </div>
        </header>

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
