import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function toErrorResponse(error: unknown, fallback = "Internal server error") {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message || "Validation failed." }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
