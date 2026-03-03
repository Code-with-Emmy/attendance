import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/config";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-device-delete",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.profile.limit,
      RATE_LIMIT_CONFIG.profile.windowMs
    );

    const { id } = await params;

    const device = await prisma.device.findFirst({
      where: { id, organizationId: auth.organizationId },
    });

    if (!device) {
      throw new ApiError(404, "Device not found or unauthorized.");
    }

    await prisma.device.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete device.");
  }
}
