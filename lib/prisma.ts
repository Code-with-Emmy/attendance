import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_CLIENT_LOGS === "true" ? ["error", "warn"] : [],
  });


if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
