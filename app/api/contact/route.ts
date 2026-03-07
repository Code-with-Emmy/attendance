import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { contactMessageSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getRequestIp, getRequestMetadata } from "@/lib/server/public-site";
import { ApiError, toErrorResponse } from "@/lib/server/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });
    const parsed = contactMessageSchema.parse(body);
    enforceRateLimit(
      "public-contact-submit",
      `${getRequestIp(req)}:${parsed.email}`,
      RATE_LIMIT_CONFIG.publicContact.limit,
      RATE_LIMIT_CONFIG.publicContact.windowMs,
    );

    const message = await prisma.contactMessage.create({
      data: {
        ...parsed,
        ...getRequestMetadata(req),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        requestId: message.id,
        message:
          "Message received. This submission is now stored for support or sales follow-up.",
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to send message.");
  }
}
