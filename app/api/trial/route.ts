import { BillingCycle, Role, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { getDisplayName } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { requireActivePlanByCode } from "@/lib/billing/getPlanByCode";
import { sendTrialWelcomeEmail } from "@/lib/email/sendTrialEmails";
import { getRequestIp, getRequestMetadata, generateUniqueOrganizationSlug } from "@/lib/server/public-site";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { trialSignupSchema } from "@/lib/validation";

function toProvisioningErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("already") || normalized.includes("exists")) {
    return {
      status: 409,
      message: "An account with that email already exists. Sign in instead.",
    };
  }

  return {
    status: 400,
    message,
  };
}

export async function POST(req: Request) {
  let createdSupabaseUserId: string | null = null;

  try {
    const body = await req.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });
    const parsed = trialSignupSchema.parse(body);
    const requestIp = getRequestIp(req);

    enforceRateLimit(
      "public-trial-submit",
      `${requestIp}:${parsed.businessEmail}`,
      RATE_LIMIT_CONFIG.publicTrial.limit,
      RATE_LIMIT_CONFIG.publicTrial.windowMs,
    );

    const existingTrial = await prisma.trialSignup.findFirst({
      where: {
        businessEmail: parsed.businessEmail,
        status: "provisioned",
      },
      select: { id: true },
    });

    if (existingTrial) {
      throw new ApiError(
        409,
        "A trial has already been provisioned for this email. Sign in to continue.",
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.businessEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "A user with this email already exists. Sign in to continue.",
      );
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: parsed.businessEmail,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        source: "attendancekiosk-trial",
      },
    });

    if (error || !data.user) {
      const mapped = toProvisioningErrorMessage(
        error?.message || "Unable to provision trial user.",
      );
      throw new ApiError(mapped.status, mapped.message);
    }

    createdSupabaseUserId = data.user.id;
    const starterPlan = await requireActivePlanByCode("starter");
    const slug = await generateUniqueOrganizationSlug(parsed.organizationName);
    const displayName = getDisplayName(parsed.businessEmail, null);
    const metadata = getRequestMetadata(req);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: parsed.organizationName,
          slug,
          email: parsed.businessEmail,
        },
      });

      const user = await tx.user.create({
        data: {
          id: createdSupabaseUserId!,
          email: parsed.businessEmail,
          name: displayName,
          role: Role.ORG_ADMIN,
          organizationId: organization.id,
        },
      });

      await tx.organizationSubscription.create({
        data: {
          organizationId: organization.id,
          subscriptionPlanId: starterPlan.id,
          status: SubscriptionStatus.TRIALING,
          billingCycle: BillingCycle.MONTHLY,
        },
      });

      const trialSignup = await tx.trialSignup.create({
        data: {
          businessEmail: parsed.businessEmail,
          organizationName: parsed.organizationName,
          teamSize: parsed.teamSize,
          planCode: starterPlan.code,
          status: "provisioned",
          organizationId: organization.id,
          userId: user.id,
          ...metadata,
        },
        select: {
          id: true,
        },
      });

      return {
        organization,
        trialSignup,
      };
    });

    try {
      await sendTrialWelcomeEmail({
        email: parsed.businessEmail,
        organizationName: result.organization.name,
        organizationSlug: result.organization.slug,
        trialSignupId: result.trialSignup.id,
      });
    } catch (emailError) {
      console.error("Failed to send trial welcome email", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        trialSignupId: result.trialSignup.id,
        loginHref: "/login",
        loginEmail: parsed.businessEmail,
        organization: {
          name: result.organization.name,
          slug: result.organization.slug,
        },
        message:
          "Trial workspace provisioned successfully. You can now sign in to the admin console.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (createdSupabaseUserId) {
      const supabase = getSupabaseServiceClient();
      await supabase.auth.admin.deleteUser(createdSupabaseUserId).catch(() => {
        return null;
      });
    }

    return toErrorResponse(error, "Failed to provision trial workspace.");
  }
}
