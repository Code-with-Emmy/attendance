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

export const FALLBACK_PUBLIC_PLANS: PublicPlan[] = [
  {
    id: "fallback-starter",
    code: "starter",
    name: "Starter",
    description: "Single-kiosk attendance for small teams.",
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    currency: "USD",
    maxEmployees: 10,
    maxDevices: 1,
    isActive: true,
    features: [
      "Basic attendance tracking",
      "Single kiosk deployment",
      "Standard reports",
    ],
    audience: "Small teams",
  },
  {
    id: "fallback-growth",
    code: "growth",
    name: "Growth",
    description: "Recommended plan for scaling teams and multi-kiosk operations.",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    currency: "USD",
    maxEmployees: 50,
    maxDevices: 3,
    isActive: true,
    features: [
      "Advanced attendance tracking",
      "Up to 3 kiosks",
      "Shift support",
      "Advanced reports",
    ],
    audience: "Scaling operations",
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "fallback-pro",
    code: "pro",
    name: "Pro",
    description: "Multi-branch attendance with payroll exports and premium support.",
    monthlyPrice: 24900,
    yearlyPrice: 249000,
    currency: "USD",
    maxEmployees: 200,
    maxDevices: 10,
    isActive: true,
    features: [
      "Multi-branch attendance",
      "Up to 10 kiosks",
      "Payroll exports",
      "Premium support",
    ],
    audience: "Multi-branch businesses",
  },
  {
    id: "fallback-enterprise",
    code: "enterprise",
    name: "Enterprise",
    description: "Custom onboarding, integrations, and SLA-backed support.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    maxEmployees: 1000000,
    maxDevices: 10000,
    isActive: true,
    features: [
      "Custom attendance workflows",
      "Custom integrations",
      "Dedicated support",
      "Enterprise SLA",
    ],
    audience: "Large organizations",
  },
];

export function getFallbackPublicPlanByCode(
  code: string | null | undefined,
): PublicPlan {
  const normalized = code?.trim().toLowerCase() || "growth";

  return (
    FALLBACK_PUBLIC_PLANS.find((plan) => plan.code === normalized) ??
    FALLBACK_PUBLIC_PLANS.find((plan) => plan.code === "growth")!
  );
}

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
