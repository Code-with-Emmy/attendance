"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { siteNavigation } from "@/lib/site-content";

const trackedSections = ["product", "features", "pricing", "security"];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("product");

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0.05,
      },
    );

    for (const id of trackedSections) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [pathname]);

  function isLinkActive(itemHref: string) {
    if (pathname !== "/") {
      return pathname === itemHref;
    }

    if (itemHref.startsWith("/#")) {
      return activeSection === itemHref.slice(2);
    }

    return pathname === itemHref;
  }

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[rgba(2,6,23,0.72)] px-5 py-3 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-6">
        <Link
          href="/"
          aria-label="AttendanceKiosk home"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <BrandLogo size="sm" className="h-7 w-7" />
          </div>
          <div className="hidden sm:block">
            <p className="font-heading text-sm font-semibold tracking-[0.02em] text-white">
              AttendanceKiosk
            </p>
            <p className="text-xs text-slate-400">
              Secure biometric attendance
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {siteNavigation.map((item) => {
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Admin Login
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:bg-[#60A5FA]"
          >
            Book Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-7xl rounded-[1.5rem] border border-white/10 bg-[rgba(2,6,23,0.94)] p-4 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:hidden"
        >
          <div className="flex flex-col gap-2">
            {siteNavigation.map((item) => {
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-slate-200"
            >
              Admin Login
            </Link>
            <Link
              href="/demo"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-5 text-sm font-semibold text-white"
            >
              Book Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}
