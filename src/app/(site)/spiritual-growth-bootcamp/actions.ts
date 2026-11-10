"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
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
  const existing = await db.sgbRegistration.findUnique({
    where: { phone: input.phone },
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
