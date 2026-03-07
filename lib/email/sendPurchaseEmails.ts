import React from "react";
import type { BillingCycle } from "@prisma/client";
import PurchaseConfirmation from "@/emails/PurchaseConfirmation";
import { sendEmail } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/payments/types";

type PurchaseConfirmationPayload = {
  purchaseIntentId: string;
  recipientEmail: string;
  organizationName: string;
  planName: string;
  billingCycle: BillingCycle;
  subscriptionStartDate: Date;
};

function formatBillingCycle(value: BillingCycle) {
  return value === "YEARLY" ? "Yearly" : "Monthly";
}

export async function sendPurchaseConfirmationEmail(
  data: PurchaseConfirmationPayload,
) {
  return sendEmail({
    to: data.recipientEmail,
    subject: "Your AttendanceKiosk Subscription is Active",
    type: "purchase_confirmation",
    metadata: {
      purchaseIntentId: data.purchaseIntentId,
      organizationName: data.organizationName,
      planName: data.planName,
      billingCycle: data.billingCycle,
    },
    react: React.createElement(PurchaseConfirmation, {
      organizationName: data.organizationName,
      planName: data.planName,
      billingCycle: formatBillingCycle(data.billingCycle),
      subscriptionStartDate: data.subscriptionStartDate.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      ),
      loginUrl: `${getAppUrl()}/login`,
    }),
  });
}
