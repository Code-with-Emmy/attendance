import { NextResponse } from "next/server";

export function getRequestId(req: Request) {
  const incoming = req.headers.get("x-request-id")?.trim();
  return incoming || crypto.randomUUID();
}

export function withRequestId(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function logInfo(message: string, context: Record<string, unknown>) {
  console.info(message, context);
}

export function logError(
  message: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  console.error(message, {
    ...context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : error,
  });
}
