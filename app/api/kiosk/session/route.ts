import { NextResponse } from "next/server";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { authenticateDeviceToken } from "@/lib/server/device-auth";

const KIOSK_COOKIE_NAME = "kiosk_device_token";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      throw new ApiError(400, "Missing kiosk device token.");
    }

    await authenticateDeviceToken(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set(KIOSK_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return toErrorResponse(error, "Failed to activate kiosk session.");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(KIOSK_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
