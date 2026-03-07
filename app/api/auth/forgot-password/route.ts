import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/email/sendAuthEmails";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getRequestIp } from "@/lib/server/public-site";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });

    const parsed = forgotPasswordSchema.parse(body);

    enforceRateLimit(
      "public-forgot-password-submit",
      `${getRequestIp(request)}:${parsed.email}`,
      RATE_LIMIT_CONFIG.publicForgotPassword.limit,
      RATE_LIMIT_CONFIG.publicForgotPassword.windowMs,
    );

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true, email: true },
    });

    if (user) {
      const token = await createPasswordResetToken({
        email: user.email,
        userId: user.id,
      });

      try {
        await sendPasswordResetEmail({
          email: user.email,
          token: token.rawToken,
          expiresAt: token.expiresAt,
        });
      } catch (error) {
        console.error("Failed to send password reset email", error);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to process forgot password request.");
  }
}
