"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";

export type InterestState = {
  ok?: boolean;
  firstName?: string;
  error?: string;
  errors?: Record<string, string>;
};

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const interestSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  birthday: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").max(160),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine((value) => value.replace(/\D/g, "").length >= 7, "Enter your WhatsApp number"),
  country: optional(60),
  monthly: z.enum(["WILLING", "NEEDS_CLARITY"], { message: "Choose an answer" }),
  giveMore: z.enum(["YES", "POSSIBLY", "NO"], { message: "Choose an answer" }),
  moreAmount: optional(60),
  startMonth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Choose a month")
    .optional()
    .or(z.literal("")),
  longTerm: z.enum(["COMMITTED", "START_AND_GROW", "NEEDS_CLARITY"], { message: "Choose an answer" }),
});

/**
 * The Angel Partners interest form: records who wants to partner and how,
 * so the team can share the next steps. No payment, no email.
 */
export async function registerInterest(_previous: InterestState, formData: FormData): Promise<InterestState> {
  const parsed = interestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { error: "A few details need another look.", errors };
  }
  const input = parsed.data;
  const email = normalizeEmail(input.email);

  const limited = await checkLoginRateLimit(`interest:${email}`, { max: 5, windowMs: 60 * 60 * 1000 });
  if (limited) return { error: limited };

  await db.partnerInterest.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      birthday: input.birthday ? new Date(`${input.birthday}T00:00:00Z`) : null,
      email,
      whatsapp: input.whatsapp,
      country: input.country || null,
      monthly: input.monthly,
      giveMore: input.giveMore,
      moreAmount: input.giveMore === "NO" ? null : input.moreAmount || null,
      startMonth: input.startMonth || null,
      longTerm: input.longTerm,
    },
  });

  return { ok: true, firstName: input.firstName };
}
