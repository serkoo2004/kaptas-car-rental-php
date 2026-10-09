import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  kvkkAccepted: z.literal(true),
  commercialConsent: z.boolean().optional(),
});

export const registerFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  kvkkAccepted: z.literal("on"),
  commercialConsent: z.string().optional(),
});

export const accountProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500),
  city: z.string().trim().max(100),
  district: z.string().trim().max(100),
  phone: z.string().trim().max(20),
});

export const contactVerificationRequestSchema = z.object({
  channel: z.literal("EMAIL"),
  target: z.string().trim().min(3).max(254),
});

export const contactVerificationConfirmSchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});
