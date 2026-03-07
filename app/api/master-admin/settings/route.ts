import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    const whitelist = await prisma.systemAdminWhitelist.findMany({
      orderBy: { createdAt: "desc" }
    });

    const secrets = await prisma.platformSecret.findMany({
        select: { key: true, description: true, updatedAt: true }
    });

    return NextResponse.json({ whitelist, secrets });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireMasterAdminAuth(req);
    const body = await req.json();
    const { type, email, role, key, value, description } = body;

    if (type === "whitelist") {
      const entry = await prisma.systemAdminWhitelist.upsert({
        where: { email: email.toLowerCase() },
        update: { role },
        create: { email: email.toLowerCase(), role }
      });
      return NextResponse.json(entry);
    }

    if (type === "secret") {
      const secret = await prisma.platformSecret.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description }
      });
      return NextResponse.json({ key: secret.key, description: secret.description, updatedAt: secret.updatedAt });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireMasterAdminAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const key = searchParams.get("key");

    if (id) {
      await prisma.systemAdminWhitelist.delete({ where: { id } });
    } else if (key) {
      await prisma.platformSecret.delete({ where: { key } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
