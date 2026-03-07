import { BillingCycle } from "@prisma/client";
import { NextResponse } from "next/server";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { createPurchaseIntent } from "@/lib/billing/createPurchaseIntent";
import { getBillingAmount } from "@/lib/billing/getPlanByCode";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { getRequestIp } from "@/lib/server/public-site";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { purchaseRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });
    const parsed = purchaseRequestSchema.parse(body);
    const requestIp = getRequestIp(request);

    enforceRateLimit(
      "public-purchase-intent",
      `${requestIp}:${parsed.workEmail}`,
      RATE_LIMIT_CONFIG.publicPurchase.limit,
      RATE_LIMIT_CONFIG.publicPurchase.windowMs,
    );

    const billingCycle =
      parsed.billingPeriod === "yearly"
        ? BillingCycle.YEARLY
        : BillingCycle.MONTHLY;

    const purchaseIntent = await createPurchaseIntent({
      businessName: parsed.businessName,
      fullName: parsed.fullName,
      workEmail: parsed.workEmail,
      phone: parsed.phone,
      companySize: parsed.companySize,
      employeeCount: parsed.employeeCount,
      deviceCount: parsed.deviceCount,
      planCode: parsed.planCode,
      billingCycle,
      submittedIp: requestIp,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        success: true,
        purchaseIntentId: purchaseIntent.id,
        organizationId: purchaseIntent.organizationId,
        planCode: purchaseIntent.subscriptionPlan.code,
        amountCents: getBillingAmount(
          purchaseIntent.subscriptionPlan,
          purchaseIntent.billingCycle,
        ),
        currency: purchaseIntent.subscriptionPlan.currency,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to create purchase intent.");
  }
}
