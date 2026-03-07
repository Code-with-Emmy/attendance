import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    const auth = await requireMasterAdminAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        organization: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name ?? "Unknown",
      email: u.email,
      role: u.role,
      org: u.organization?.name ?? "-",
      status: "Active",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireMasterAdminAuth(req);
    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: "Missing ID or role" }, { status: 400 });
    }

    // Safety check: Cannot demote your own account
    if (id === auth.dbUser.id) {
      return NextResponse.json(
        { error: "Cannot modify your own administrative role" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      include: { organization: true },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name ?? "Unknown",
      email: updated.email,
      role: updated.role,
      org: updated.organization?.name ?? "-",
      status: "Active",
    });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireMasterAdminAuth(req);
    const body = await req.json();
    const { email, role, name, organizationId } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const created = await prisma.user.create({
      data: {
        id: crypto.randomUUID(), // Assuming identity is managed separately or assigned on login
        email,
        role,
        name,
        organizationId: organizationId || null,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
