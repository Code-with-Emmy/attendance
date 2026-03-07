import React from "react";
import DemoConfirmation from "@/emails/DemoConfirmation";
import DemoRequestNotification from "@/emails/DemoRequestNotification";
import { sendEmail, getAdminInboxRecipients } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/payments/types";

type DemoEmailPayload = {
  requestId: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  teamSize: string;
  message: string;
};

export async function sendDemoRequestNotification(data: DemoEmailPayload) {
  return sendEmail({
    to: getAdminInboxRecipients(),
    subject: "New Demo Request",
    type: "demo_request_notification",
    replyTo: data.email,
    metadata: {
      demoRequestId: data.requestId,
      company: data.company,
      email: data.email,
    },
    react: React.createElement(DemoRequestNotification, {
      fullName: data.fullName,
      company: data.company,
      email: data.email,
      phone: data.phone,
      teamSize: data.teamSize,
      message: data.message,
    }),
  });
}

export async function sendDemoConfirmationEmail(data: DemoEmailPayload) {
  return sendEmail({
    to: data.email,
    subject: "Your AttendanceKiosk Demo Request",
    type: "demo_confirmation",
    metadata: {
      demoRequestId: data.requestId,
      company: data.company,
    },
    react: React.createElement(DemoConfirmation, {
      fullName: data.fullName,
      company: data.company,
      demoUrl: `${getAppUrl()}/demo`,
    }),
  });
}
