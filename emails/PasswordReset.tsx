import * as React from "react";
import { EmailCard, EmailLayout, EmailParagraph } from "@/emails/_components";

type PasswordResetProps = {
  resetUrl: string;
  expiresIn: string;
};

export function PasswordReset({ resetUrl, expiresIn }: PasswordResetProps) {
  return (
    <EmailLayout
      preview="Reset your AttendanceKiosk password"
      eyebrow="Password Reset"
      title="Reset your AttendanceKiosk password"
      ctaLabel="Reset Password"
      ctaHref={resetUrl}
    >
      <EmailParagraph>
        We received a request to reset your AttendanceKiosk password. Use the
        secure link below to choose a new password.
      </EmailParagraph>

      <EmailCard title="Reset instructions">
        <EmailParagraph>
          This secure link expires in {expiresIn}. If you did not request a
          password reset, you can ignore this message and your credentials will
          remain unchanged.
        </EmailParagraph>
      </EmailCard>
    </EmailLayout>
  );
}

export default PasswordReset;
