import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const footerLinks = [
  { label: "Product", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Demo", href: "/demo" },
  { label: "Contact", href: "/contact" },
  { label: "Login", href: "/login" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/6 bg-slate-950/80">
      <div className="site-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-xl">
            <p className="section-label">AttendanceKiosk</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              Biometric attendance with a premium public website and a clear path
              into demo, trial, login, and subscription flows.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Turn tablets and laptops into secure attendance kiosks with
              liveness verification, admin controls, and payroll-ready records.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-400/30 hover:bg-white/7 hover:text-white"
              >
                <span className="flex items-center justify-between gap-2">
                  {item.label}
                  <ArrowUpRight className="h-4 w-4 opacity-50 transition group-hover:opacity-100" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-divider mt-10 flex flex-col gap-3 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AttendanceKiosk. Built for modern workforce operations.</p>
          <p>Secure clock-in, clock-out, reporting, and compliance visibility.</p>
        </div>
      </div>
    </footer>
  );
}
