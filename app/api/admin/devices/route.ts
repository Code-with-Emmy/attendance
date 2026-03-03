import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { toErrorResponse } from "@/lib/server/errors";
import { enforceDeviceLimit } from "@/lib/server/billing";
import { hashDeviceToken } from "@/lib/server/device-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit("admin-devices-list", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.history.limit, RATE_LIMIT_CONFIG.history.windowMs);

    const devices = await prisma.device.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(devices);
  } catch (error) {
    return toErrorResponse(error, "Failed to load devices.");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit("admin-devices-create", `${auth.ip}:${auth.dbUser.id}`, RATE_LIMIT_CONFIG.profile.limit, RATE_LIMIT_CONFIG.profile.windowMs);

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    await enforceDeviceLimit(auth.organizationId);

    const activationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashDeviceToken(activationToken);

    const device = await prisma.device.create({
      data: {
        name: name.trim(),
        token: tokenHash,
        organizationId: auth.organizationId,
      },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      device,
      activationToken,
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to create device.");
  }
}
