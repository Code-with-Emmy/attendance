import { Role, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type AuthContext = {
  dbUser: User;
  organizationId: string;
  organizationName: string;
  ip: string;
  accessToken: string;
};

type AppUserIdentity = {
  id: string;
  email: string;
  name: string;
};

function parseBearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function getAdminEmails() {
  const adminEmails = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .flatMap((value) => (value || "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(adminEmails);
}

export function getDisplayName(rawEmail: string, metadataName: unknown) {
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }
  const emailBase = rawEmail.split("@")[0] || "User";
  return emailBase;
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }

  return req.headers.get("x-real-ip") || "unknown";
}

export async function upsertAppUser(identity: AppUserIdentity) {
  const { id, email, name } = identity;
  const adminEmails = getAdminEmails();
  const shouldBeAdmin = adminEmails.has(email.toLowerCase());

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    const defaultOrg = await prisma.organization.findFirst({
      where: { slug: "default" },
      select: { id: true },
    });

    return prisma.user.create({
      data: {
        id,
        email,
        name,
        role: shouldBeAdmin ? Role.ADMIN : Role.USER,
        organizationId: defaultOrg?.id,
      },
    });
  }

  const nextRole = shouldBeAdmin ? Role.ADMIN : existing.role;
  const nextName = existing.name ?? name;
  const needsUpdate =
    existing.email !== email ||
    existing.name !== nextName ||
    existing.role !== nextRole;

  if (!needsUpdate) {
    return existing;
  }

  return prisma.user.update({
    where: { id },
    data: {
      email,
      name: nextName,
      role: nextRole,
    },
  });
}

export async function requireAuth(req: Request): Promise<AuthContext> {
  const token = parseBearerToken(req);
  if (!token) {
    throw new ApiError(401, "Missing or invalid bearer token.");
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, "Invalid access token.");
  }

  if (!data.user.email) {
    throw new ApiError(400, "Authenticated user must have an email.");
  }

  const name = getDisplayName(data.user.email, data.user.user_metadata?.name ?? data.user.user_metadata?.full_name);
  const dbUser = await upsertAppUser({
    id: data.user.id,
    email: data.user.email,
    name,
  });

  const organizationId = requireOrg(dbUser);
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  return {
    dbUser,
    organizationId,
    organizationName: organization?.name ?? "Unknown Organization",
    ip: getClientIp(req),
    accessToken: token,
  };
}

export function requireAdmin(user: User) {
  if (user.role !== Role.ADMIN) {
    throw new ApiError(403, "Admin access required.");
  }
}

export function requireOrg(user: User): string {
  if (!user.organizationId) {
    throw new ApiError(403, "Organization context required. Please contact support.");
  }
  return user.organizationId;
}
