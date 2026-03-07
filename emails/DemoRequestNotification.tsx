import * as React from "react";
import { Text } from "@react-email/components";
import { EmailCard, EmailLayout, EmailParagraph } from "@/emails/_components";

type DemoRequestNotificationProps = {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  teamSize: string;
  message: string;
};

export function DemoRequestNotification({
  fullName,
  company,
  email,
  phone,
  teamSize,
  message,
}: DemoRequestNotificationProps) {
  return (
    <EmailLayout
      preview={`New demo request from ${company}`}
      eyebrow="New Demo Request"
      title={`${company} wants a guided AttendanceKiosk walkthrough`}
      ctaLabel="Reply to Prospect"
      ctaHref={`mailto:${email}`}
    >
      <EmailParagraph>
        A new demo request has been submitted on the public website.
      </EmailParagraph>

      <EmailCard title="Prospect details">
        <Text style={detailStyle}>
          <strong>Name:</strong> {fullName}
        </Text>
        <Text style={detailStyle}>
          <strong>Company:</strong> {company}
        </Text>
        <Text style={detailStyle}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={detailStyle}>
          <strong>Phone:</strong> {phone}
        </Text>
        <Text style={detailStyle}>
          <strong>Team size:</strong> {teamSize}
        </Text>
      </EmailCard>

      <EmailCard title="Message">
        <Text style={detailStyle}>{message}</Text>
      </EmailCard>
    </EmailLayout>
  );
}

const detailStyle = {
  color: "#CBD5E1",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0 0 10px",
};

export default DemoRequestNotification;
