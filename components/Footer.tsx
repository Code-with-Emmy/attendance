import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Security", href: "/#security" },
  { label: "Contact", href: "/contact" },
  { label: "Admin Login", href: "/login" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#020617]">
      <div className="site-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <BrandLogo size="sm" className="h-7 w-7" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-white">
                  AttendanceKiosk
                </p>
                <p className="text-sm text-slate-400">
                  Facial recognition attendance for modern workplaces
                </p>
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-slate-400">
              Secure kiosk check-ins, real-time attendance visibility, and
              payroll-ready reporting for organizations that need trustworthy
              workforce data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AttendanceKiosk. All rights reserved.</p>
          <p>Built for secure attendance, stronger accountability, and cleaner reporting.</p>
        </div>
      </div>
    </footer>
  );
}
