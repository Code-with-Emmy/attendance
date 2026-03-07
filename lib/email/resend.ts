import type { ReactElement } from "react";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  type: string;
  react: ReactElement;
  metadata?: Record<string, unknown>;
  replyTo?: string | string[];
  from?: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getEmailFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "AttendanceKiosk <onboarding@resend.dev>"
  );
}

export function getSupportEmailAddress() {
  return process.env.SUPPORT_EMAIL || "support@attendancekiosk.com";
}

export function getAdminInboxRecipients() {
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",")
    .split(",");

  const recipients = Array.from(
    new Set(
      raw
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  if (recipients.length > 0) {
    return recipients;
  }

  return [getSupportEmailAddress()];
}

export async function sendEmail(input: SendEmailInput) {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const normalizedRecipients = recipients
    .map((recipient) => recipient.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedRecipients.length === 0) {
    throw new Error("At least one recipient is required.");
  }

  try {
    const client = getResendClient();
    const result = await client.emails.send({
      from: input.from || getEmailFromAddress(),
      to: normalizedRecipients,
      subject: input.subject,
      react: input.react,
      replyTo: input.replyTo,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    await prisma.emailLog.createMany({
      data: normalizedRecipients.map((recipient) => ({
        recipient,
        subject: input.subject,
        type: input.type,
        status: "SENT",
        metadata: {
          ...(input.metadata || {}),
          provider: "RESEND",
          providerMessageId: result.data?.id || null,
        } as never,
      })),
    });

    return result.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email delivery failed.";

    await prisma.emailLog
      .createMany({
        data: normalizedRecipients.map((recipient) => ({
          recipient,
          subject: input.subject,
          type: input.type,
          status: "FAILED",
          metadata: {
            ...(input.metadata || {}),
            provider: "RESEND",
            error: message,
          } as never,
        })),
      })
      .catch(() => null);

    throw error;
  }
}
