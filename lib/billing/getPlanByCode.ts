import { BillingCycle, Prisma, type SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  FALLBACK_PUBLIC_PLANS,
  type PublicPlan,
  formatPublicMoney,
  getFallbackPublicPlanByCode,
  getPublicPlanAmount,
} from "@/lib/billing/public";
import { ApiError } from "@/lib/server/errors";
import {
  isPrismaDatabaseUnavailable,
  logDatabaseUnavailableOnce,
} from "@/lib/server/prisma-availability";

export type DbPlanSummary = PublicPlan;

function extractFeatureLabels(features: Prisma.JsonValue | null): string[] {
  if (!features) {
    return [];
  }

  if (Array.isArray(features)) {
    return features.flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }

      if (
        item &&
        typeof item === "object" &&
        "label" in item &&
        typeof item.label === "string"
      ) {
        return [item.label];
      }

      return [];
    });
  }

  if (typeof features === "object") {
    return Object.entries(features).flatMap(([key, value]) =>
      value === true ? [key] : [],
    );
  }

  return [];
}

export function mapPlanSummary(plan: SubscriptionPlan): DbPlanSummary {
  let audience: string | undefined;
  let badge: string | undefined;
  let highlight: boolean | undefined;

  if (plan.features && typeof plan.features === "object" && !Array.isArray(plan.features)) {
    const f = plan.features as Record<string, unknown>;
    if (typeof f.audience === "string") audience = f.audience;
    if (typeof f.badge === "string") badge = f.badge;
    if (typeof f.highlight === "boolean") highlight = f.highlight;
  }

  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    currency: plan.currency,
    maxEmployees: plan.maxEmployees,
    maxDevices: plan.maxDevices,
    isActive: plan.isActive,
    features: extractFeatureLabels(plan.features as Prisma.JsonValue | null),
    audience,
    badge,
    highlight,
  };
}

export async function listActivePlans(): Promise<DbPlanSummary[]> {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { monthlyPrice: "asc" },
        { createdAt: "asc" },
      ],
    });

    return plans.map(mapPlanSummary);
  } catch (error) {
    if (!isPrismaDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseUnavailableOnce(
      "billing:listActivePlans",
      "Billing catalog read failed. Falling back to built-in public plans.",
    );
    return FALLBACK_PUBLIC_PLANS;
  }
}

export async function getPlanByCode(
  code: string | null | undefined,
): Promise<DbPlanSummary> {
  const normalized = code?.trim().toLowerCase() || "growth";

  try {
    const plan =
      (await prisma.subscriptionPlan.findFirst({
        where: {
          code: normalized,
          isActive: true,
        },
      })) ??
      (await prisma.subscriptionPlan.findFirst({
        where: {
          code: "growth",
          isActive: true,
        },
      }));

    if (!plan) {
      throw new ApiError(404, "No active pricing plans are configured.");
    }

    return mapPlanSummary(plan);
  } catch (error) {
    if (!isPrismaDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseUnavailableOnce(
      "billing:getPlanByCode",
      "Plan lookup failed. Falling back to built-in public plan.",
    );
    return getFallbackPublicPlanByCode(normalized);
  }
}

export async function requireActivePlanByCode(code: string) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      code: code.trim().toLowerCase(),
      isActive: true,
    },
  });

  if (!plan) {
    throw new ApiError(404, "Selected plan is not available.");
  }

  return plan;
}

export function getBillingAmount(
  plan: Pick<SubscriptionPlan, "monthlyPrice" | "yearlyPrice">,
  billingCycle: BillingCycle,
) {
  return getPublicPlanAmount(plan, billingCycle);
}

export function formatMoney(amountCents: number, currency: string) {
  return formatPublicMoney(amountCents, currency);
}
