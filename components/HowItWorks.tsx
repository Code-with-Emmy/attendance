"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, ScanFace, Workflow } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";
import { workflowSteps } from "@/lib/site-content";

const stepIcons = [Camera, ScanFace, Workflow];

export function HowItWorks() {
  return (
    <section className="bg-[#020617]">
      <div className="site-container grid gap-10 py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
            How It Works
          </p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Secure attendance in three simple steps.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Employees get a fast check-in experience. Operations teams get
            instant visibility, stronger verification, and cleaner records.
          </p>

          <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(15,23,42,0.85)] shadow-[0_18px_60px_rgba(2,6,23,0.3)]">
            <div className="relative aspect-[4/3]">
              <Image
                src={siteAssets.workflowVisual}
                alt="AttendanceKiosk workflow visual"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {workflowSteps.map((item, index) => {
            const Icon = stepIcons[index] ?? Workflow;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-[1.6rem] border border-white/10 bg-[rgba(15,23,42,0.85)] p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#93C5FD]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {item.step}
                      </p>
                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-3 font-heading text-2xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.description}
                    </p>
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
