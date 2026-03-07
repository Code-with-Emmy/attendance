import * as React from "react";
import { EmailCard, EmailLayout, EmailList, EmailParagraph } from "@/emails/_components";

type PurchaseConfirmationProps = {
  organizationName: string;
  planName: string;
  billingCycle: string;
  subscriptionStartDate: string;
  loginUrl: string;
};

export function PurchaseConfirmation({
  organizationName,
  planName,
  billingCycle,
  subscriptionStartDate,
  loginUrl,
}: PurchaseConfirmationProps) {
  return (
    <EmailLayout
      preview="Your AttendanceKiosk subscription is active"
      eyebrow="Subscription Active"
      title={`${planName} is now active for ${organizationName}`}
      ctaLabel="Continue Setup"
      ctaHref={loginUrl}
    >
      <EmailParagraph>
        Your AttendanceKiosk subscription has been activated successfully and
        your billing record is now attached to your organization.
      </EmailParagraph>

      <EmailCard title="Subscription details">
        <EmailList
          items={[
            `Plan: ${planName}`,
            `Billing cycle: ${billingCycle}`,
            `Subscription start date: ${subscriptionStartDate}`,
          ]}
        />
      </EmailCard>

      <EmailCard title="Setup instructions">
        <EmailList
          items={[
            "Sign in to the admin console and confirm organization settings.",
            "Register kiosk devices and enroll your first employee profiles.",
            "Review attendance dashboards and export payroll-ready reports.",
          ]}
        />
      </EmailCard>
    </EmailLayout>
  );
}

export default PurchaseConfirmation;
