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
        <h2 className="mt-4 section-heading text-[#021141]">
          Straightforward plans for self-serve teams and custom rollouts.
        </h2>
        <p className="section-copy mt-5">
          Start with a single kiosk or scale to multiple branches. Switch
          between monthly and annual billing at any time.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setBilling("MONTHLY")}
          className={`border px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] transition ${
            billing === "MONTHLY"
              ? "border-[#E67300]/28 bg-[#E67300] text-white"
              : "border-[#d8c6a8]/40 bg-white text-[#5b4e3a]"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("YEARLY")}
          className={`border px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] transition ${
            billing === "YEARLY"
              ? "border-[#E67300]/28 bg-[#E67300] text-white"
              : "border-[#d8c6a8]/40 bg-white text-[#5b4e3a]"
          }`}
        >
          Yearly
        </button>
        <span className="border border-[#E67300]/22 bg-[#fff2e3] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#9a4c00]">
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
            className={`rounded-[1.7rem] border bg-white p-6 shadow-[0_18px_48px_rgba(2,17,65,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(2,17,65,0.08)] ${
              plan.highlight
                ? "border-[#E67300]/40 ring-1 ring-[#E67300]/12"
                : "border-[#d8c6a8]/40"
            }`}
          >
            <div className="flex min-h-14 items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#E67300]">{plan.name}</p>
                <p className="mt-2 text-sm text-[#5c6784]">{plan.audience}</p>
              </div>
              {plan.badge ? (
                <span className="border border-[#E67300]/20 bg-[#fff2e3] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#9a4c00]">
                  {plan.badge}
                </span>
              ) : null}
            </div>

            <div className="mt-8">
              <p className="text-4xl font-black tracking-tight text-[#021141]">
                {plan.code === "enterprise"
                  ? "Custom"
                  : `${formatPublicMoney(
                      getPublicPlanAmount(plan, billing),
                      plan.currency,
                    )}/${billing === "YEARLY" ? "year" : "month"}`}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#5c6784]">
                {plan.description}
              </p>
            </div>

            <div className="mt-6 border-t border-[#ece2d1] pt-6">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-[#314160]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#E67300]" />
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
