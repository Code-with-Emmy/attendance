import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/server/errors";

const loggedScopes = new Set<string>();

export function isPrismaDatabaseUnavailable(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server")
  );
}

export function rethrowAsDatabaseUnavailable(
  error: unknown,
  message = "Database is unavailable. Try again when the connection is restored.",
): never {
  if (isPrismaDatabaseUnavailable(error)) {
    throw new ApiError(503, message);
  }

  throw error;
}

export function logDatabaseUnavailableOnce(scope: string, message: string) {
  if (loggedScopes.has(scope)) {
    return;
  }

  loggedScopes.add(scope);
  console.warn(message);
}
