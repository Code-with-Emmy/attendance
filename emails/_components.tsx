import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type EmailLayoutProps = {
  preview: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
};

const colors = {
  background: "#020617",
  panel: "#0f172acc",
  panelBorder: "rgba(148,163,184,0.12)",
  text: "#E5E7EB",
  muted: "#94A3B8",
  accent: "#3B82F6",
  success: "#22C55E",
};

const supportEmail = process.env.SUPPORT_EMAIL || "support@attendancekiosk.com";

const bodyStyle = {
  backgroundColor: colors.background,
  color: colors.text,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: "0",
  padding: "32px 16px",
};

const containerStyle = {
  backgroundColor: "#0f172a",
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: "28px",
  margin: "0 auto",
  maxWidth: "640px",
  overflow: "hidden",
};

const sectionStyle = {
  padding: "32px 32px 0 32px",
};

const brandMarkStyle = {
  background:
    "linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(34,197,94,0.9) 100%)",
  borderRadius: "18px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "18px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  lineHeight: "1",
  padding: "14px 16px",
};

const eyebrowStyle = {
  color: "#93C5FD",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  margin: "16px 0 0",
  textTransform: "uppercase" as const,
};

const titleStyle = {
  color: colors.text,
  fontFamily:
    "'Sora', 'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "-0.03em",
  lineHeight: "1.2",
  margin: "16px 0 0",
};

const paragraphStyle = {
  color: colors.muted,
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "16px 0 0",
};

const buttonStyle = {
  backgroundColor: colors.accent,
  borderRadius: "14px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 20px",
  textDecoration: "none",
};

const cardStyle = {
  backgroundColor: colors.panel,
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: "20px",
  marginTop: "24px",
  padding: "20px",
};

const footerStyle = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "1.7",
  margin: "0",
};

export function EmailLayout({
  preview,
  title,
  eyebrow,
  children,
  ctaLabel,
  ctaHref,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={brandMarkStyle}>AK</Text>
            <Text style={eyebrowStyle}>{eyebrow}</Text>
            <Heading as="h1" style={titleStyle}>
              {title}
            </Heading>
            <Text style={paragraphStyle}>
              Face-verified attendance for modern workplaces.
            </Text>
            {ctaLabel && ctaHref ? (
              <Section style={{ marginTop: "24px" }}>
                <Button href={ctaHref} style={buttonStyle}>
                  {ctaLabel}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Section style={{ ...sectionStyle, paddingTop: "8px" }}>
            {children}
          </Section>

          <Section style={{ ...sectionStyle, paddingBottom: "32px" }}>
            <Hr
              style={{
                borderColor: colors.panelBorder,
                margin: "0 0 20px",
              }}
            />
            <Text style={footerStyle}>
              Need help? Reply to this email or contact{" "}
              <Link
                href={`mailto:${supportEmail}`}
                style={{ color: "#BFDBFE" }}
              >
                {supportEmail}
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={cardStyle}>
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: "16px",
          fontWeight: "600",
          margin: "0 0 10px",
        }}
      >
        {title}
      </Text>
      {children}
    </Section>
  );
}

export function EmailList({ items }: { items: string[] }) {
  return (
    <Section style={{ marginTop: "20px" }}>
      {items.map((item, index) => (
        <Text
          key={item}
          style={{
            color: colors.muted,
            fontSize: "15px",
            lineHeight: "1.8",
            margin: index === 0 ? "0" : "10px 0 0",
          }}
        >
          <span style={{ color: colors.success, fontWeight: "700" }}>
            {index + 1}.
          </span>{" "}
          {item}
        </Text>
      ))}
    </Section>
  );
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={paragraphStyle}>{children}</Text>;
}
