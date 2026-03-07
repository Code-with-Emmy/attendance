import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated endpoint. Use /api/purchase/create-intent and /api/purchase/create-checkout-session.",
    },
    { status: 410 },
  );
}
