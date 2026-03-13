"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, LayoutDashboard, ScanFace } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";

const screenshotCards = [
  {
    title: "Kiosk scanning interface",
    subtitle: "Live liveness prompt + face verification",
    icon: ScanFace,
    src: siteAssets.kioskScreen,
  },
  {
    title: "Admin dashboard",
    subtitle: "Team visibility and exception handling",
    icon: LayoutDashboard,
    src: siteAssets.dashboardScreen,
  },
  {
    title: "Attendance analytics",
    subtitle: "Export-ready summaries and attendance trends",
    icon: Activity,
    src: siteAssets.analyticsScreen,
  },
] as const;

export function ProductScreenshots() {
  return (
    <section className="border-y border-white/10 bg-[#020617]">
      <div className="site-container py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
            Product Screenshots
          </p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Product views that feel operational, not conceptual.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Your local product visuals anchor the page, while the surrounding
            glass cards make each screen read like a polished SaaS workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {screenshotCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(15,23,42,0.85)] shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {card.subtitle}
                    </p>
                    <h3 className="mt-2 font-heading text-xl font-semibold text-white">
                      {card.title}
                    </h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#93C5FD]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-[1.3rem] border border-white/10 bg-[#0F172A] p-3">
                    <div className="mb-3 flex items-center gap-2 px-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] border border-white/6 bg-slate-950">
                      <Image
                        src={card.src}
                        alt={card.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
