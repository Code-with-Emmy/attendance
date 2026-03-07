import * as React from "react";
import { EmailCard, EmailLayout, EmailList, EmailParagraph } from "@/emails/_components";

type DemoConfirmationProps = {
  fullName: string;
  company: string;
  demoUrl: string;
};

export function DemoConfirmation({
  fullName,
  company,
  demoUrl,
}: DemoConfirmationProps) {
  return (
    <EmailLayout
      preview="Your AttendanceKiosk demo request is in review"
      eyebrow="Demo Request Received"
      title={`Thanks ${fullName}, your demo request is in motion`}
      ctaLabel="View Product Overview"
      ctaHref={demoUrl}
    >
      <EmailParagraph>
        We received your request for an AttendanceKiosk walkthrough for{" "}
        <strong>{company}</strong>. A product specialist will review your notes
        and follow up with scheduling options shortly.
      </EmailParagraph>

      <EmailCard title="What happens next">
        <EmailList
          items={[
            "We review your attendance setup and deployment goals.",
            "A specialist reaches out to coordinate a live demo slot.",
            "We tailor the walkthrough around kiosks, reporting, and rollout scope.",
          ]}
        />
      </EmailCard>
    </EmailLayout>
  );
}

export default DemoConfirmation;
