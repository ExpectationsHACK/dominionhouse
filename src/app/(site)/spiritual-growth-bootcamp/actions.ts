"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";
import { z } from "zod";

export type SgbRegistrationState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
};

const sgbRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(60),
  lastName: z.string().trim().min(2, "Enter your last name").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Enter your phone number")
    .max(30, "Enter a valid phone number")
    .regex(/^\+?[\d\s()-]+$/, "Enter a valid phone number")
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 7, "Enter a valid phone number"),
  gender: z.enum(["Male", "Female"], { message: "Choose your gender" }),
  age: z.coerce.number().int().min(10, "You must be at least 10").max(100, "Enter an age of 100 or below"),
  location: z.string().trim().min(2, "Enter your city and country").max(120),
});

export async function registerForSgb(
  _previous: SgbRegistrationState,
  formData: FormData,
): Promise<SgbRegistrationState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { error: "We could not submit your registration. Please try again." };
  }

  const parsed = sgbRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Some details need another look.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  // Its own limits, not the sign-in ones: a leader may register a whole group
  // from one phone or the church Wi-Fi, so the address limit is generous.
  const byPhone = rateLimit(`sgb-phone:${input.phone.slice(-9)}`, { max: 5, windowMs: 60 * 60 * 1000 });
  const byIp = rateLimit(`sgb-ip:${await requestIp()}`, { max: 30, windowMs: 60 * 60 * 1000 });
  if (!byPhone.ok || !byIp.ok) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  // The same number typed as 0803…, +234803… or 234803…: match on the last
  // nine digits, as camp sign-in does (phonesMatch in src/lib/utils.ts).
  const existing = await db.sgbRegistration.findFirst({
    where: { phone: { endsWith: input.phone.slice(-9) } },
    select: { id: true },
  });
  if (existing) {
    return { error: "This phone number is already registered for the Bootcamp." };
  }

  try {
    await db.sgbRegistration.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        gender: input.gender,
        age: input.age,
        location: input.location,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "This phone number is already registered for the Bootcamp." };
    }
    throw error;
  }

  return { ok: true };
}
