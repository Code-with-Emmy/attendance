import { Role, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/server/errors";
import { rethrowAsDatabaseUnavailable } from "@/lib/server/prisma-availability";
import { getTrustedRequestIp } from "@/lib/server/request-ip";
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
  const adminEmails = [
    process.env.ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
    process.env.MASTER_ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .flatMap((value) => (value || "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(adminEmails);
}

function getMasterAdminEmails() {
  const masterAdminEmails = [process.env.MASTER_ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => (value || "").split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(masterAdminEmails);
}

export function getDisplayName(rawEmail: string, metadataName: unknown) {
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }
  const emailBase = rawEmail.split("@")[0] || "User";
  return emailBase;
}

function getClientIp(req: Request) {
  return getTrustedRequestIp(req);
}

export async function upsertAppUser(identity: AppUserIdentity) {
  try {
    const { id, email, name } = identity;
    const emailLower = email.toLowerCase();

    const whitelistEntry = await prisma.systemAdminWhitelist.findUnique({
      where: { email: emailLower },
    });

    const adminEmails = getAdminEmails();
    const masterAdminEmails = getMasterAdminEmails();
    const isEnvMaster = masterAdminEmails.has(emailLower);
    const isEnvAdmin = adminEmails.has(emailLower);

    let bootstrapRole: Role | null = null;
    if (whitelistEntry) {
      bootstrapRole = whitelistEntry.role;
    } else if (isEnvMaster) {
      bootstrapRole = Role.MASTER_ADMIN;
    } else if (isEnvAdmin) {
      bootstrapRole = Role.ADMIN;
    }

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
          role: bootstrapRole || Role.USER,
          organizationId: defaultOrg?.id,
        },
      });
    }

    const currentRole = existing.role;
    let nextRole = currentRole;

    if (whitelistEntry) {
      nextRole = whitelistEntry.role;
    } else if (isEnvMaster) {
      nextRole = Role.MASTER_ADMIN;
    } else if (isEnvAdmin && currentRole !== Role.MASTER_ADMIN) {
      nextRole = Role.ADMIN;
    } else if (
      currentRole === Role.ADMIN ||
      currentRole === Role.MASTER_ADMIN
    ) {
      nextRole = Role.USER;
    }

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
  } catch (error) {
    rethrowAsDatabaseUnavailable(
      error,
      "Database is unavailable. Sign-in succeeded, but app data cannot load until the database connection is restored.",
    );
  }
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
  try {
    const dbUser = await upsertAppUser({
      id: data.user.id,
      email: data.user.email,
      name,
    });

    const organizationId =
      dbUser.role === Role.MASTER_ADMIN ? dbUser.organizationId : requireOrg(dbUser);
    const organization = organizationId
      ? await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        })
      : null;

    return {
      dbUser,
      organizationId: organizationId || "",
      organizationName: organization?.name ?? "Platform Management",
      ip: getClientIp(req),
      accessToken: token,
    };
  } catch (error) {
    rethrowAsDatabaseUnavailable(
      error,
      "Database is unavailable. Authenticated app features require a live database connection.",
    );
  }
}

export type MasterAuthContext = {
  dbUser: User;
  ip: string;
  accessToken: string;
};

export async function requireMasterAdminAuth(req: Request): Promise<MasterAuthContext> {
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
  try {
    const dbUser = await upsertAppUser({
      id: data.user.id,
      email: data.user.email,
      name,
    });

    requireMasterAdmin(dbUser);

    return {
      dbUser,
      ip: getClientIp(req),
      accessToken: token,
    };
  } catch (error) {
    rethrowAsDatabaseUnavailable(
      error,
      "Database is unavailable. Master admin features require a live database connection.",
    );
  }
}

export function requireAdmin(user: User) {
  if (user.role !== Role.ADMIN && user.role !== Role.MASTER_ADMIN && user.role !== Role.ORG_ADMIN) {
    throw new ApiError(403, "Admin access required.");
  }
}

export function requireMasterAdmin(user: User) {
  if (user.role !== Role.MASTER_ADMIN) {
    throw new ApiError(403, "Master Admin access required.");
  }
}

export function requireOrg(user: User): string {
  if (!user.organizationId) {
    throw new ApiError(403, "Organization context required. Please contact support.");
  }
  return user.organizationId;
}
