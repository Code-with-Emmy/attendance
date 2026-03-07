import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import {
  sendDemoConfirmationEmail,
  sendDemoRequestNotification,
} from "@/lib/email/sendDemoEmails";
import { demoRequestSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getRequestIp, getRequestMetadata } from "@/lib/server/public-site";
import { ApiError, toErrorResponse } from "@/lib/server/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => {
      throw new ApiError(400, "Invalid request payload.");
    });
    const parsed = demoRequestSchema.parse(body);
    enforceRateLimit(
      "public-demo-submit",
      `${getRequestIp(req)}:${parsed.email}`,
      RATE_LIMIT_CONFIG.publicDemo.limit,
      RATE_LIMIT_CONFIG.publicDemo.windowMs,
    );

    const request = await prisma.demoRequest.create({
      data: {
        ...parsed,
        ...getRequestMetadata(req),
      },
      select: { id: true },
    });

    const emailPayload = {
      requestId: request.id,
      ...parsed,
    };

    const emailResults = await Promise.allSettled([
      sendDemoRequestNotification(emailPayload),
      sendDemoConfirmationEmail(emailPayload),
    ]);

    emailResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Demo email dispatch failed", result.reason);
      }
    });

    return NextResponse.json(
      {
        success: true,
        requestId: request.id,
        message:
          "Demo request received. Our team can use this record to follow up and schedule a walkthrough.",
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "Failed to submit demo request.");
  }
}
