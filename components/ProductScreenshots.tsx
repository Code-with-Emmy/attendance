"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Camera,
  Clock3,
  MonitorSmartphone,
} from "lucide-react";

const previewCards = [
  {
    title: "Kiosk scanning UI",
    subtitle: "Touchless clock-in",
    icon: Camera,
  },
  {
    title: "Admin dashboard",
    subtitle: "Workforce visibility",
    icon: MonitorSmartphone,
  },
  {
    title: "Analytics and reports",
    subtitle: "Payroll-ready insights",
    icon: Activity,
  },
];

export function ProductScreenshots() {
  return (
    <section className="site-container py-18">
      <div className="max-w-3xl">
        <p className="section-label">Product Screens</p>
        <h2 className="mt-4 section-heading text-white">
          Premium product previews that show the kiosk, admin layer, and
          reporting experience.
        </h2>
        <p className="section-copy mt-5">
          These polished interface previews stand in for production screenshots
          and communicate how the product behaves across the public website.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {previewCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="site-card overflow-hidden rounded-[1.8rem] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {card.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {card.title}
                  </h3>
                </div>
                <div className="rounded-2xl border border-blue-400/18 bg-blue-500/10 p-3 text-blue-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {index === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Visitor kiosk</span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      Ready
                    </span>
                  </div>
                  <div className="mt-4 flex aspect-[4/5] items-center justify-center rounded-[1.4rem] border border-blue-400/12 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_40%)]">
                    <div className="rounded-[1.4rem] border border-cyan-300/20 bg-cyan-400/10 p-6">
                      <Camera className="h-12 w-12 text-cyan-200" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-400">Liveness scan</span>
                    <span className="font-semibold text-white">In progress</span>
                  </div>
                </div>
              ) : null}

              {index === 1 ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Present today
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        94%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Active kiosks
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        12
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-400">Main office</span>
                      <span className="font-semibold text-emerald-300">
                        Stable
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-400">Branch East</span>
                      <span className="font-semibold text-white">3 late</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {index === 2 ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4">
                  <div className="flex items-end gap-2">
                    {[42, 66, 58, 90, 74, 82].map((height, itemIndex) => (
                      <div
                        key={height + itemIndex}
                        className="flex-1 rounded-t-full bg-gradient-to-t from-blue-500 to-emerald-300"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <BadgeCheck className="h-4 w-4 text-emerald-300" />
                        Verified attendance
                      </span>
                      <span className="font-semibold text-white">1,284</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock3 className="h-4 w-4 text-blue-300" />
                        Payroll export
                      </span>
                      <span className="font-semibold text-emerald-300">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
