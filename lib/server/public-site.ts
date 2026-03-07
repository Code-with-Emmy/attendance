import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }

  return req.headers.get("x-real-ip") || "unknown";
}

export function getRequestMetadata(req: Request) {
  return {
    submittedIp: getRequestIp(req),
    userAgent: req.headers.get("user-agent"),
  };
}

function slugify(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (normalized.length > 0) {
    return normalized;
  }

  return `org-${crypto.randomUUID().slice(0, 8)}`;
}

export async function generateUniqueOrganizationSlug(name: string) {
  const base = slugify(name);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 6)}`;

    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
