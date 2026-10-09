import { z } from "zod";

export const quoteRequestSchema = z.object({
  userType: z.enum(["INDIVIDUAL", "SOLE_PROPRIETORSHIP", "SME", "CORPORATE"]),
  brandText: z.string().trim().min(1).max(120),
  modelText: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().int().min(1).max(500),
  durationMonths: z.coerce.number().int().min(12).max(60),
  annualKm: z.coerce.number().int().min(5000).max(100000),
  companyName: z.string().trim().max(180).optional(),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().min(7).max(30),
  note: z.string().trim().max(1000).optional(),
  kvkkAccepted: z.literal("on"),
  commercialConsent: z.string().optional(),
});
