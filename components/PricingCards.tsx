"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import {
  formatPublicMoney,
  getPublicPlanAmount,
  type PublicBillingCycle,
  type PublicPlan,
} from "@/lib/billing/public";

type PricingCardsProps = {
  variant?: "preview" | "full";
  plans: PublicPlan[];
};

export function PricingCards({ plans, variant = "full" }: PricingCardsProps) {
  const [billing, setBilling] = useState<PublicBillingCycle>("MONTHLY");

  return (
    <section className={variant === "full" ? "site-container py-18" : ""}>
      <div className={variant === "full" ? "max-w-3xl" : "max-w-2xl"}>
        <p className="section-label">Pricing</p>
        <h2 className="mt-4 section-heading text-white">
          Straightforward plans for self-serve teams and custom rollouts.
        </h2>
        <p className="section-copy mt-5">
          Start with a single kiosk or scale to multiple branches. Switch
          between monthly and annual billing at any time.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setBilling("MONTHLY")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            billing === "MONTHLY"
              ? "bg-blue-500 text-white"
              : "border border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("YEARLY")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            billing === "YEARLY"
              ? "bg-blue-500 text-white"
              : "border border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          Yearly
        </button>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          2 months free on annual billing
        </span>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <motion.article
            key={plan.code}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className={`site-card hover-lift rounded-[1.8rem] p-6 ${
              plan.highlight ? "ring-1 ring-blue-400/35" : ""
            }`}
          >
            <div className="flex min-h-14 items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  {plan.name}
                </p>
                <p className="mt-2 text-sm text-slate-400">{plan.audience}</p>
              </div>
              {plan.badge ? (
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  {plan.badge}
                </span>
              ) : null}
            </div>

            <div className="mt-8">
              <p className="text-4xl font-semibold tracking-tight text-white">
                {plan.code === "enterprise"
                  ? "Custom"
                  : `${formatPublicMoney(
                      getPublicPlanAmount(plan, billing),
                      plan.currency,
                    )}/${billing === "YEARLY" ? "year" : "month"}`}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {plan.description}
              </p>
            </div>

            <div className="surface-divider mt-6 pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={
                plan.code === "enterprise"
                  ? "/demo"
                  : `/purchase?plan=${plan.code}`
              }
              className="cta-primary mt-8 w-full"
            >
              {plan.code === "enterprise"
                ? "Talk to Sales"
                : `Choose ${plan.name}`}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>
        ))}
      </div>

      {variant === "preview" ? (
        <div className="mt-8 flex justify-start">
          <Link href="/pricing" className="cta-secondary">
            View Full Pricing
          </Link>
        </div>
      ) : null}
    </section>
  );
}
