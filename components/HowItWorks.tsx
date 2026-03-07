"use client";

import { motion } from "framer-motion";
import { workflowSteps } from "@/lib/site-content";

export function HowItWorks() {
  return (
    <section className="site-container py-18">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="section-label">How It Works</p>
          <h2 className="mt-4 section-heading text-white">
            A three-step experience that feels fast for staff and dependable for
            operations.
          </h2>
          <p className="section-copy mt-5">
            The kiosk flow is intentionally simple on the device and much richer
            in the admin layer where teams review attendance, anomalies, and
            payroll outcomes.
          </p>
        </div>

        <div className="space-y-4">
          {workflowSteps.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="site-card hover-lift rounded-[1.8rem] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {item.title}
                  </h3>
                </div>
                <div className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  0{index + 1}
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
