"use client";

import type {
  PublicBillingCycle,
  PublicPlan,
} from "@/lib/billing/public";
import { formatPublicMoney, getPublicPlanAmount } from "@/lib/billing/public";

type PlanSelectorProps = {
  plans: PublicPlan[];
  selectedPlanCode: string;
  billingPeriod: PublicBillingCycle;
  onPlanChange: (planCode: string) => void;
  onBillingChange: (period: PublicBillingCycle) => void;
};

export function PlanSelector({
  plans,
  selectedPlanCode,
  billingPeriod,
  onPlanChange,
  onBillingChange,
}: PlanSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onBillingChange("MONTHLY")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            billingPeriod === "MONTHLY"
              ? "bg-blue-500 text-white"
              : "border border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          Monthly billing
        </button>
        <button
          type="button"
          onClick={() => onBillingChange("YEARLY")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            billingPeriod === "YEARLY"
              ? "bg-blue-500 text-white"
              : "border border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          Yearly billing
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans
          .filter((plan) => plan.code !== "enterprise")
          .map((plan) => {
            const active = plan.code === selectedPlanCode;

            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => onPlanChange(plan.code)}
                className={`rounded-[1.5rem] border p-5 text-left transition ${
                  active
                    ? "border-blue-400/40 bg-blue-500/10 shadow-[0_18px_44px_rgba(37,99,235,0.18)]"
                    : "border-white/8 bg-white/5 hover:border-blue-400/20 hover:bg-white/7"
                }`}
              >
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="mt-2 text-sm text-slate-400">{plan.audience}</p>
                <p className="mt-4 text-2xl font-semibold text-white">
                  {`${formatPublicMoney(
                    getPublicPlanAmount(plan, billingPeriod),
                    plan.currency,
                  )}/${billingPeriod === "YEARLY" ? "yr" : "mo"}`}
                </p>
              </button>
            );
          })}
      </div>
    </div>
  );
}
