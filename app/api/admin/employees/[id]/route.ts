import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { updateProfileSchema } from "@/lib/validation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-employee-profile",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.profile.limit,
      RATE_LIMIT_CONFIG.profile.windowMs,
    );

    const { id } = await params;
    const target = await prisma.employee.findFirst({
      where: { id, organizationId: auth.organizationId },
    });

    if (!target) {
      throw new ApiError(404, "Target employee not found.");
    }

    const body = await req.json();
    const parsed = updateProfileSchema.parse(body);

    const updates: {
      name?: string;
      phone?: string | null;
      department?: string | null;
      title?: string | null;
      bio?: string | null;
      imageUrl?: string | null;
    } = {};

    if (parsed.name !== undefined) {
      if (parsed.name === null) {
        throw new ApiError(400, "Employee name cannot be empty.");
      }
      updates.name = parsed.name;
    }
    if (parsed.phone !== undefined) updates.phone = parsed.phone;
    if (parsed.department !== undefined) updates.department = parsed.department;
    if (parsed.title !== undefined) updates.title = parsed.title;
    if (parsed.bio !== undefined) updates.bio = parsed.bio;
    if (parsed.imageUrl !== undefined) updates.imageUrl = parsed.imageUrl;

    const updated = await prisma.employee.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        title: true,
        bio: true,
        imageUrl: true,
        faceEnrolledAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        ...updated,
        faceEnrolledAt: updated.faceEnrolledAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to update employee.");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-employee-delete",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.profile.limit,
      RATE_LIMIT_CONFIG.profile.windowMs,
    );

    const { id } = await params;
    
    // Check ownership before delete
    const target = await prisma.employee.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!target) {
      throw new ApiError(404, "Target employee not found.");
    }

    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete employee.");
  }
}
