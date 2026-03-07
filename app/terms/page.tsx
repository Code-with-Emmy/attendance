import { LegalPageShell } from "@/components/LegalPageShell";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms of Service"
      title="Using AttendanceKiosk in production"
      description="These terms establish the baseline operating rules for organizations using the kiosk, admin control desk, attendance reporting, and device registration workflows."
      sections={[
        {
          title: "Authorized use",
          body: "Customers are responsible for limiting enrollment, device access, and admin permissions to authorized personnel. Device credentials and activation tokens must be protected as operational secrets.",
        },
        {
          title: "Customer obligations",
          body: "Customers should obtain any employee consents required by local law, configure retention policies, and validate payroll outputs before making employment or compensation decisions.",
        },
        {
          title: "Service limitations",
          body: "The product is designed to provide a tamper-evident attendance trail and operational reporting. It should not be marketed as an infallible or legally determinative source of truth in every jurisdiction without legal review.",
        },
      ]}
    />
  );
}
