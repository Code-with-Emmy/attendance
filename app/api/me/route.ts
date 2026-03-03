import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { updateProfileSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    enforceRateLimit("profile-read", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.profile.limit, RATE_LIMIT_CONFIG.profile.windowMs);

    return NextResponse.json({
      id: auth.dbUser.id,
      email: auth.dbUser.email,
      name: auth.dbUser.name,
      phone: auth.dbUser.phone,
      department: auth.dbUser.department,
      title: auth.dbUser.title,
      bio: auth.dbUser.bio,
      role: auth.dbUser.role,
      organizationId: auth.organizationId,
      organizationName: auth.organizationName,
      faceEnrolledAt: auth.dbUser.faceEnrolledAt?.toISOString() ?? null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth(req);
    enforceRateLimit("profile-update", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.profile.limit, RATE_LIMIT_CONFIG.profile.windowMs);

    const body = await req.json();
    const parsed = updateProfileSchema.parse(body);

    const updates: {
      name?: string | null;
      phone?: string | null;
      department?: string | null;
      title?: string | null;
      bio?: string | null;
    } = {};

    if (parsed.name !== undefined) {
      updates.name = parsed.name;
    }
    if (parsed.phone !== undefined) {
      updates.phone = parsed.phone;
    }
    if (parsed.department !== undefined) {
      updates.department = parsed.department;
    }
    if (parsed.title !== undefined) {
      updates.title = parsed.title;
    }
    if (parsed.bio !== undefined) {
      updates.bio = parsed.bio;
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.dbUser.id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        department: updatedUser.department,
        title: updatedUser.title,
        bio: updatedUser.bio,
        role: updatedUser.role,
        faceEnrolledAt: updatedUser.faceEnrolledAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to update profile.");
  }
}
