export type PublicBillingCycle = "MONTHLY" | "YEARLY";

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxEmployees: number;
  maxDevices: number;
  isActive: boolean;
  features: string[];
  audience?: string;
  badge?: string;
  highlight?: boolean;
};

export function getPublicPlanAmount(
  plan: Pick<PublicPlan, "monthlyPrice" | "yearlyPrice">,
  billingCycle: PublicBillingCycle,
) {
  return billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function formatPublicMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}
