import React from "react";
import TrialWelcome from "@/emails/TrialWelcome";
import { sendEmail } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/payments/types";

type TrialWelcomePayload = {
  email: string;
  organizationName: string;
  organizationSlug: string;
  trialSignupId: string;
};

export async function sendTrialWelcomeEmail(data: TrialWelcomePayload) {
  return sendEmail({
    to: data.email,
    subject: "Welcome to AttendanceKiosk",
    type: "trial_welcome",
    metadata: {
      trialSignupId: data.trialSignupId,
      organizationName: data.organizationName,
      organizationSlug: data.organizationSlug,
    },
    react: React.createElement(TrialWelcome, {
      organizationName: data.organizationName,
      loginUrl: `${getAppUrl()}/login`,
    }),
  });
}
