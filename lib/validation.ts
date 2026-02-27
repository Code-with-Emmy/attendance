import { z } from "zod";
import { EMBEDDING_DIMENSION } from "@/lib/config";

const optionalTrimmedText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    })
    .refine((value) => value === undefined || value === null || value.length <= max, {
      message: `Must be at most ${max} characters.`,
    });

const optionalEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length ? trimmed : null;
  })
  .refine(
    (value) => value === undefined || value === null || z.string().email().safeParse(value).success,
    "Must be a valid email address.",
  );

export const embeddingSchema = z
  .array(z.number().finite())
  .length(EMBEDDING_DIMENSION, `Embedding must contain exactly ${EMBEDDING_DIMENSION} values.`);

export const enrollFaceSchema = z.object({
  embedding: embeddingSchema,
});

export const verifyFaceSchema = z.object({
  embedding: embeddingSchema,
});

export const clockAttendanceSchema = z.object({
  type: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  distance: z.number().min(0).max(3),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(10_000).optional(),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
})
  .refine((value) => {
    if (!value.start || !value.end) {
      return true;
    }
    return new Date(value.start).getTime() < new Date(value.end).getTime();
  }, "Start date must be before end date.");

export const updateProfileSchema = z.object({
  name: optionalTrimmedText(100),
  phone: optionalTrimmedText(40),
  department: optionalTrimmedText(80),
  title: optionalTrimmedText(80),
  bio: optionalTrimmedText(500),
});

export const createAdminUserSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(128),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  name: optionalTrimmedText(100).optional(),
  phone: optionalTrimmedText(40).optional(),
  department: optionalTrimmedText(80).optional(),
  title: optionalTrimmedText(80).optional(),
  bio: optionalTrimmedText(500).optional(),
});

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: optionalEmail.optional(),
  phone: optionalTrimmedText(40).optional(),
  department: optionalTrimmedText(80).optional(),
  title: optionalTrimmedText(80).optional(),
  bio: optionalTrimmedText(500).optional(),
});
