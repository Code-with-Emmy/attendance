import { prisma } from "@/lib/prisma";

export async function getPlatformSecret(key: string): Promise<string | null> {
  // 1. Try Database
  try {
    const secret = await prisma.platformSecret.findUnique({
      where: { key }
    });
    if (secret) {
      return secret.value;
    }
  } catch (err) {
    console.error(`Failed to fetch platform secret from DB: ${key}`, err);
  }

  // 2. Fallback to Env
  return process.env[key] || null;
}

export async function setPlatformSecret(key: string, value: string, description?: string) {
  return prisma.platformSecret.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description }
  });
}
