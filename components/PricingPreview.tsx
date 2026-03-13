"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  formatPublicMoney,
  getPublicPlanAmount,
  type PublicPlan,
} from "@/lib/billing/public";

type PricingPreviewProps = {
  plans: PublicPlan[];
};

export function PricingPreview({ plans }: PricingPreviewProps) {
  return (
    <section id="pricing" className="bg-[#020617]">
      <div className="site-container py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
            Pricing
          </p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Flexible plans from single-site pilots to enterprise rollouts.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Start small, prove the workflow, and scale with the controls,
            reporting, and support your organization needs.
          </p>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.code}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`rounded-[1.8rem] border p-6 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl ${
                plan.highlight
                  ? "border-[#3B82F6]/40 bg-[linear-gradient(180deg,rgba(29,78,216,0.18),rgba(15,23,42,0.95))]"
                  : "border-white/10 bg-[rgba(15,23,42,0.85)]"
              }`}
            >
              <div className="flex min-h-16 items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-2xl font-semibold text-white">
                    {plan.name}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{plan.audience}</p>
                </div>
                {plan.badge ? (
                  <span className="rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-3 py-1 text-xs font-semibold text-[#BFDBFE]">
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-8">
                <p className="font-heading text-5xl font-semibold tracking-[-0.04em] text-white">
                  {plan.code === "enterprise"
                    ? "Custom"
                    : formatPublicMoney(
                        getPublicPlanAmount(plan, "MONTHLY"),
                        plan.currency,
                      )}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {plan.code === "enterprise" ? "Tailored pricing" : "per month"}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-200"
                  >
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#22C55E]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.code === "enterprise"
                    ? "/demo"
                    : `/purchase?plan=${plan.code}`
                }
                className={`mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-[#3B82F6] text-white shadow-[0_16px_36px_rgba(59,130,246,0.3)] hover:bg-[#60A5FA]"
                    : "border border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {plan.code === "enterprise" ? "Talk to Sales" : `Choose ${plan.name}`}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
