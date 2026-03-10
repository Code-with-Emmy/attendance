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

export const kioskManualVerificationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  workEmail: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  reason: z.string().trim().min(5).max(300),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
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
  imageUrl: z.string().optional().nullable(),
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

const publicEmail = z
  .string()
  .trim()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());

const requiredTrimmedText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const teamSizeSchema = z.enum([
  "1-25",
  "26-100",
  "101-250",
  "251-500",
  "500+",
]);

export const billingPeriodSchema = z.enum(["monthly", "yearly"]);
export const paymentProviderSchema = z.enum(["STRIPE", "FLUTTERWAVE"]);

export const sitePlanSchema = z.enum([
  "starter",
  "growth",
  "pro",
  "enterprise",
]);

export const selfServePlanSchema = z.enum(["starter", "growth", "pro"]);

export const demoRequestSchema = z.object({
  fullName: requiredTrimmedText(2, 120),
  company: requiredTrimmedText(2, 120),
  email: publicEmail,
  phone: requiredTrimmedText(7, 40),
  teamSize: teamSizeSchema,
  message: requiredTrimmedText(10, 2_000),
});

export const contactMessageSchema = z.object({
  name: requiredTrimmedText(2, 120),
  email: publicEmail,
  company: requiredTrimmedText(2, 120),
  subject: requiredTrimmedText(2, 160),
  message: requiredTrimmedText(10, 2_000),
});

export const trialSignupSchema = z
  .object({
    businessEmail: publicEmail,
    organizationName: requiredTrimmedText(2, 120),
    teamSize: teamSizeSchema,
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: publicEmail,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(32).max(256),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const purchaseRequestSchema = z.object({
  fullName: requiredTrimmedText(2, 120),
  businessName: requiredTrimmedText(2, 120),
  workEmail: publicEmail,
  phone: requiredTrimmedText(7, 40),
  companySize: teamSizeSchema,
  employeeCount: z.coerce.number().int().min(1).max(100000),
  deviceCount: z.coerce.number().int().min(1).max(10000),
  planCode: selfServePlanSchema,
  billingPeriod: billingPeriodSchema,
});

export const createCheckoutSessionSchema = z.object({
  purchaseIntentId: z.string().uuid(),
  provider: paymentProviderSchema.optional(),
});
