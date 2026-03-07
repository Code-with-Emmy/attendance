import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { createEmployeeSchema } from "@/lib/validation";
import { enforceEmployeeLimit } from "@/lib/server/billing";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-employees",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.history.limit,
      RATE_LIMIT_CONFIG.history.windowMs,
    );

    const employees = await prisma.employee.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: [{ createdAt: "desc" }],
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

    return NextResponse.json(
      employees.map((employee) => ({
        ...employee,
        faceEnrolledAt: employee.faceEnrolledAt?.toISOString() ?? null,
      })),
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to load employees.");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "admin-employees-create",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.profile.limit,
      RATE_LIMIT_CONFIG.profile.windowMs,
    );

    const body = await req.json();
    const parsed = createEmployeeSchema.parse(body);

    await enforceEmployeeLimit(auth.organizationId);

    if (parsed.email) {
      const existingByEmail = await prisma.employee.findUnique({
        where: { email: parsed.email },
        select: { id: true },
      });
      if (existingByEmail) {
        throw new ApiError(409, "Employee email already exists.");
      }
    }

    const created = await prisma.employee.create({
      data: {
        organizationId: auth.organizationId,
        name: parsed.name,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        department: parsed.department ?? null,
        title: parsed.title ?? null,
        bio: parsed.bio ?? null,
      },
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
        ...created,
        faceEnrolledAt: created.faceEnrolledAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create employee.");
  }
}
