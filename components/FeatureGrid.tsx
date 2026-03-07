"use client";

import { motion } from "framer-motion";
import { featureItems } from "@/lib/site-content";

export function FeatureGrid() {
  return (
    <section id="features" className="site-container py-18">
      <div className="max-w-3xl">
        <p className="section-label">Features</p>
        <h2 className="mt-4 section-heading text-white">
          Replace paper, PINs, and guesswork with a secure attendance operating
          layer.
        </h2>
        <p className="section-copy mt-5">
          AttendanceKiosk combines device control, biometric verification, and
          reporting in a product experience designed to feel reliable from the
          first scan to payroll export.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featureItems.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="site-card hover-lift rounded-[1.6rem] p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/18 bg-blue-500/10 text-blue-200">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.description}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
