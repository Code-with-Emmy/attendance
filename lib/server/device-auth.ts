import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";

export type DeviceContext = {
  deviceId: string;
  organizationId: string;
  name: string;
};

const KIOSK_COOKIE_NAME = "kiosk_device_token";

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readKioskCookie(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const matched = parts.find((part) => part.startsWith(`${KIOSK_COOKIE_NAME}=`));
  if (!matched) {
    return null;
  }

  const [, value = ""] = matched.split("=");
  return decodeURIComponent(value);
}

export async function authenticateDeviceToken(
  token: string,
): Promise<DeviceContext> {
  const tokenHash = hashDeviceToken(token);

  let device = await prisma.device.findFirst({
    where: { token: tokenHash },
    select: {
      id: true,
      organizationId: true,
      name: true,
    },
  });

  if (!device) {
    const legacyDevice = await prisma.device.findFirst({
      where: { token },
      select: {
        id: true,
        organizationId: true,
        name: true,
      },
    });

    if (legacyDevice) {
      await prisma.device.update({
        where: { id: legacyDevice.id },
        data: { token: tokenHash },
      });
      device = legacyDevice;
    }
  }

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

export async function requireDevice(req: Request): Promise<DeviceContext> {
  const token = req.headers.get("x-kiosk-token") || readKioskCookie(req);

  if (!token) {
    throw new ApiError(401, "Missing kiosk device token.");
  }

  return authenticateDeviceToken(token);
}
