import { z } from "zod";

const userRoleSchema = z.enum(["ADMIN", "EDITOR", "USER"]);
const contactStatusSchema = z.enum([
  "new",
  "in_progress",
  "completed",
  "closed",
]);

const trimmedString = z.string().trim();

export const loginBodySchema = z
  .object({
    email: trimmedString.email("Valid email is required").max(320),
    password: trimmedString.min(1, "Password is required").max(128),
  })
  .strict();

export const refreshBodySchema = z
  .object({
    refreshToken: trimmedString.min(1, "Refresh token is required").max(4096),
  })
  .strict();

export const selfUpdateUserBodySchema = z
  .object({
    name: trimmedString.min(2, "Name must be at least 2 characters").max(120),
  })
  .strict();

export const adminCreateUserBodySchema = z
  .object({
    email: trimmedString.email("Valid email is required").max(320),
    name: trimmedString.min(2, "Name must be at least 2 characters").max(120),
    password: trimmedString
      .min(8, "Password must be at least 8 characters")
      .max(128),
    role: userRoleSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const adminUpdateUserBodySchema = z
  .object({
    email: trimmedString.email("Valid email is required").max(320).optional(),
    name: trimmedString.min(2, "Name must be at least 2 characters").max(120).optional(),
    password: trimmedString
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .optional(),
    role: userRoleSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const contactStatusBodySchema = z
  .object({
    status: contactStatusSchema,
    reason: trimmedString.max(500).optional(),
  })
  .strict();

export const contactReplyBodySchema = z
  .object({
    replyMessage: trimmedString
      .min(10, "Reply message must be at least 10 characters")
      .max(4000),
    status: contactStatusSchema.optional(),
    reason: trimmedString.max(500).optional(),
  })
  .strict();
