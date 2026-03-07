import * as React from "react";
import { EmailCard, EmailLayout, EmailList, EmailParagraph } from "@/emails/_components";

type TrialWelcomeProps = {
  organizationName: string;
  loginUrl: string;
};

export function TrialWelcome({
  organizationName,
  loginUrl,
}: TrialWelcomeProps) {
  return (
    <EmailLayout
      preview={`Welcome to AttendanceKiosk, ${organizationName}`}
      eyebrow="Trial Provisioned"
      title={`Welcome to AttendanceKiosk, ${organizationName}`}
      ctaLabel="Open Admin Login"
      ctaHref={loginUrl}
    >
      <EmailParagraph>
        Your trial workspace is ready. You can now log in, configure your
        organization, and start verifying attendance with a biometric kiosk.
      </EmailParagraph>

      <EmailCard title="Recommended onboarding steps">
        <EmailList
          items={[
            "Create organization settings and confirm your operational details.",
            "Add employees who should clock in through the kiosk.",
            "Register your kiosk device and test liveness verification.",
            "Start tracking attendance and export the first reporting cycle.",
          ]}
        />
      </EmailCard>
    </EmailLayout>
  );
}

export default TrialWelcome;
