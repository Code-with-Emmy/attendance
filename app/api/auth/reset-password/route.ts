import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { hashPasswordResetToken } from "@/lib/email/sendAuthEmails";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getRequestIp } from "@/lib/server/public-site";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });

    const parsed = resetPasswordSchema.parse(body);

    enforceRateLimit(
      "public-reset-password-submit",
      `${getRequestIp(request)}:${parsed.token.slice(0, 12)}`,
      RATE_LIMIT_CONFIG.publicResetPassword.limit,
      RATE_LIMIT_CONFIG.publicResetPassword.windowMs,
    );

    const tokenHash = hashPasswordResetToken(parsed.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now() ||
      !resetToken.user
    ) {
      throw new ApiError(400, "This reset link is invalid or has expired.");
    }

    const claimResult = await prisma.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (claimResult.count !== 1) {
      throw new ApiError(400, "This reset link is invalid or has expired.");
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(resetToken.user.id, {
      password: parsed.password,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now sign in.",
      loginHref: "/login",
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to reset password.");
  }
}
