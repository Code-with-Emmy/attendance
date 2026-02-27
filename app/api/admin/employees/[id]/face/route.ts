import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enrollFaceSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit("admin-employee-face-enroll", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.enroll.limit, RATE_LIMIT_CONFIG.enroll.windowMs);

    const { id } = await params;
    const target = await prisma.employee.findUnique({ where: { id } });

    if (!target) {
      throw new ApiError(404, "Target employee not found.");
    }

    const body = await req.json();
    const parsed = enrollFaceSchema.parse(body);

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        faceEmbedding: parsed.embedding,
        faceEnrolledAt: new Date(),
      },
      select: {
        faceEnrolledAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      enrolledAt: updated.faceEnrolledAt?.toISOString() ?? null,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to enroll employee face.");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-employee-face-delete",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.faceDelete.limit,
      RATE_LIMIT_CONFIG.faceDelete.windowMs,
    );

    const { id } = await params;
    const target = await prisma.employee.findUnique({ where: { id } });

    if (!target) {
      throw new ApiError(404, "Target employee not found.");
    }

    await prisma.employee.update({
      where: { id },
      data: {
        faceEmbedding: Prisma.DbNull,
        faceEnrolledAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to clear employee face.");
  }
}
