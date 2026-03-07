"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const APP_ROUTES = [
  { href: "/", label: "Home" },
  { href: "/kiosk", label: "Kiosk" },
  { href: "/attendance", label: "Attendance Redirect" },
  { href: "/login", label: "Login" },
  { href: "/admin", label: "Admin Overview" },
  { href: "/admin/devices", label: "Admin Devices" },
  { href: "/admin/enroll", label: "Admin Enroll" },
  { href: "/admin/history", label: "Admin History" },
  { href: "/admin/payroll", label: "Admin Payroll" },
  { href: "/admin/shifts", label: "Admin Shifts" },
  { href: "/admin/violations", label: "Admin Violations" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
] as const;

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function RouteNavigator({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = normalizePath(query);
  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return APP_ROUTES;
    }

    return APP_ROUTES.filter(
      (route) =>
        route.href.toLowerCase().includes(needle) ||
        route.label.toLowerCase().includes(needle),
    );
  }, [query]);

  function navigateTo(path: string) {
    const nextPath = normalizePath(path);
    if (!nextPath) {
      return;
    }

    router.push(nextPath);
    setOpen(false);
    setQuery("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateTo(query);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between text-left transition hover:border-blue-400/28 hover:bg-white/8 ${
          compact
            ? "gap-3 rounded-3xl border border-white/10 bg-white/5 px-3.5 py-3 shadow-[0_18px_40px_rgba(2,6,23,0.28)]"
            : "gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-2xl border border-blue-400/18 bg-blue-500/10 text-blue-300 ${
              compact ? "h-9 w-9" : "h-11 w-11"
            }`}
          >
            <Compass
              className={`${compact ? "h-4.5 w-4.5" : "h-5 w-5"}`}
              aria-hidden="true"
            />
          </div>
          <div>
            <p
              className={`font-black uppercase text-slate-400 ${
                compact
                  ? "text-[0.6rem] tracking-[0.28em]"
                  : "text-[0.68rem] tracking-[0.34em]"
              }`}
            >
              Route Access
            </p>
            <p
              className={`mt-1 font-bold text-white ${compact ? "text-xs" : "text-sm"}`}
            >
              {pathname}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border border-white/10 bg-white/5 font-black uppercase text-slate-300 ${
            compact
              ? "px-2.5 py-0.75 text-[0.58rem] tracking-[0.2em]"
              : "px-3 py-1 text-[0.68rem] tracking-[0.24em]"
          }`}
        >
          Open
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/70 px-4 backdrop-blur-md"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: "easeOut",
            }}
          >
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0, y: 12, scale: 0.99 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.24,
                ease: "easeOut",
              }}
              className="kiosk-panel kiosk-glow relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-white/10"
            >
              <div className="z-10 flex shrink-0 items-center justify-between border-b border-white/8 bg-slate-950/40 px-5 py-4 backdrop-blur-md">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
                    Route Navigator
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    Go to any route
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/8"
                  aria-label="Close route navigator"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 md:flex-row"
                >
                  <label className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="/admin/history"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#3B82F6]/40"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!normalizedQuery}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[linear-gradient(135deg,#2563EB,#22D3EE)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    Navigate
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="text-slate-500">Current route</span>
                  <code className="rounded-full bg-slate-950/60 px-3 py-1 text-white ring-1 ring-white/8">
                    {pathname}
                  </code>
                </div>

                <div className="mt-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
                    Quick Routes
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {filteredRoutes.map((route) => (
                      <button
                        key={route.href}
                        type="button"
                        onClick={() => navigateTo(route.href)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-[#3B82F6]/30 hover:bg-white/8"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {route.label}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                            {route.href}
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4.5 w-4.5 text-[#7DD3FC]"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
