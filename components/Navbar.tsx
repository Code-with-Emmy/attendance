"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { siteNavigation } from "@/lib/site-content";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sections = ["product", "features"];
    const observerOptions = {
      root: null,
      rootMargin: "-10% 0px -80% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  function isLinkActive(itemHref: string) {
    if (pathname !== "/") {
      return pathname === itemHref;
    }

    // On home page, check both exact path and scroll hash
    if (itemHref === "/") return true;
    if (itemHref.startsWith("/#")) {
      const id = itemHref.substring(2);
      return activeSection === id;
    }

    return pathname === itemHref;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-slate-950/72 backdrop-blur-xl transition-all duration-300">
      <div className="site-container">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            aria-label="AttendanceKiosk home"
            className="flex items-center"
          >
            <BrandLogo
              size="lg"
              className="h-14 w-32 drop-shadow-[0_12px_28px_rgba(2,6,23,0.6)]"
            />
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {siteNavigation.map((item) => {
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "bg-blue-500/16 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/25"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/demo" className="cta-secondary h-11 px-6">
              Book Demo
            </Link>
            <Link href="/login" className="cta-primary h-11 px-6">
              Admin Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="border-t border-white/6 bg-slate-950/95 lg:hidden"
        >
          <div className="site-container flex flex-col gap-3 py-4">
            {siteNavigation.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "border-blue-400/25 bg-blue-500/10 text-white"
                      : "border-white/8 bg-white/5 text-slate-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/demo"
              onClick={() => setIsOpen(false)}
              className="cta-secondary"
            >
              Book Demo
            </Link>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="cta-primary"
            >
              Admin Login
            </Link>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}
