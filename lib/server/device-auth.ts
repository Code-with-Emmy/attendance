import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export type DeviceContext = {
  deviceId: string;
  organizationId: string;
  name: string;
};

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requireDevice(req: Request): Promise<DeviceContext> {
  const token = req.headers.get("x-kiosk-token");

  if (!token) {
    throw new ApiError(401, "Missing kiosk device token.");
  }

  const tokenHash = hashDeviceToken(token);

  const device = await prisma.device.findFirst({
    where: {
      OR: [{ token: tokenHash }, { token }],
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
    },
  });

  if (!device) {
    throw new ApiError(401, "Invalid kiosk device token.");
  }

  // Update last active
  await prisma.device.update({
    where: { id: device.id },
    data: { lastActiveAt: new Date() },
  });

  return {
    deviceId: device.id,
    organizationId: device.organizationId,
    name: device.name,
  };
}
