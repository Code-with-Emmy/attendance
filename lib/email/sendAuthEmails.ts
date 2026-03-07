import crypto from "crypto";
import React from "react";
import PasswordReset from "@/emails/PasswordReset";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/payments/types";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(params: {
  email: string;
  userId: string;
}) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.updateMany({
    where: {
      email: params.email,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      email: params.email,
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
  expiresAt: Date;
}) {
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(params.token)}`;

  return sendEmail({
    to: params.email,
    subject: "Reset Your AttendanceKiosk Password",
    type: "password_reset",
    metadata: {
      email: params.email,
      expiresAt: params.expiresAt.toISOString(),
    },
    react: React.createElement(PasswordReset, {
      resetUrl,
      expiresIn: "60 minutes",
    }),
  });
}
