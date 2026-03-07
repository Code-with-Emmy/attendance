import { LegalPageShell } from "@/components/LegalPageShell";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy Policy"
      title="Attendance data and biometric handling"
      description="This page explains how attendance records, device identifiers, and biometric templates are handled across the kiosk, admin app, and related attendance workflows. Treat it as a product-facing baseline and expand it with jurisdiction-specific legal language before launch."
      sections={[
        {
          title: "What we collect",
          body: "The platform processes employee profile details, attendance events, kiosk device identifiers, and facial embeddings used for identity verification. Raw image retention should remain optional and governed by your internal policy and regulatory obligations.",
        },
        {
          title: "How it is used",
          body: "Attendance data is used to verify clock-in and clock-out events, generate audit-ready records, support payroll reporting, and secure kiosk access. Access should be limited to authorized administrators and approved backend services.",
        },
        {
          title: "Retention and access",
          body: "Retention periods, deletion timelines, biometric consent requirements, and data-subject rights should be aligned with local employment and privacy law before customer rollout. This page is a product baseline, not legal advice.",
        },
      ]}
    />
  );
}
