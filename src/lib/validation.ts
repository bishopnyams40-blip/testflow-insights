import { z } from "zod";

/**
 * Shared Zod schemas. Frontend uses them for UX; server functions re-validate
 * with the same schemas so the backend stays authoritative.
 */

export const appRoleSchema = z.enum(["CLIENT", "TESTER", "ADMIN"]);
export const signupRoleSchema = z.enum(["CLIENT", "TESTER"]);

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255);

export const passwordSchema = z
  .string()
  .min(10, { message: "Use at least 10 characters" })
  .max(128, { message: "Password is too long" })
  .regex(/[a-z]/, { message: "Include a lowercase letter" })
  .regex(/[A-Z]/, { message: "Include an uppercase letter" })
  .regex(/[0-9]/, { message: "Include a number" });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }).max(128),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1, { message: "First name is required" }).max(80),
    lastName: z.string().trim().min(1, { message: "Last name is required" }).max(80),
    role: signupRoleSchema,
    organizationName: z.string().trim().max(120).optional(),
    country: z.string().trim().max(80).optional(),
  })
  .refine((data) => data.role !== "CLIENT" || (data.organizationName ?? "").length > 1, {
    message: "Company or organisation name is required",
    path: ["organizationName"],
  });

export const serviceTypeSchema = z.enum([
  "USER_FEEDBACK",
  "BUG_TESTING",
  "USABILITY_TESTING",
  "BETA_TESTING",
  "TARGETED_RESEARCH",
]);

export const campaignDraftSchema = z.object({
  organizationId: z.string().uuid(),
  serviceType: serviceTypeSchema,
  name: z.string().trim().min(3).max(140),
  objective: z.string().trim().max(2000).optional(),
  description: z.string().trim().max(5000).optional(),
  productUrl: z.string().trim().url().max(2048).optional(),
  participantTarget: z.number().int().min(1).max(1000),
  deadline: z.string().datetime().optional(),
});

export const conversationSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.enum(["CAMPAIGN", "GENERAL_SUPPORT", "PAYMENT", "TECHNICAL_SUPPORT"]),
  subject: z.string().trim().min(3).max(160),
  campaignId: z.string().uuid().nullable().optional(),
  paymentId: z.string().uuid().nullable().optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
