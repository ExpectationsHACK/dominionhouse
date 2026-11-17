"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";
import { OTHER_LOCATION, SGB_LOCATIONS } from "./locations";

const LOCATION_NAMES: [string, ...string[]] = [OTHER_LOCATION, ...SGB_LOCATIONS.map((place) => place.name)];

export type SgbRegistrationState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
};

const sgbRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(60),
  lastName: z.string().trim().min(2, "Enter your last name").max(60),
  // The form posts the full international number (+2348031234567); it must
  // be complete for its country, not just the right characters.
  phone: z
    .string()
    .trim()
    .min(1, "Enter your WhatsApp number")
    .refine((value) => isValidPhoneNumber(value), "Enter the full number, including the country code")
    .transform((value) => parsePhoneNumberFromString(value)!.number),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  gender: z.enum(["Male", "Female"], { message: "Choose your gender" }),
  location: z.enum(LOCATION_NAMES, { message: "Choose your location" }),
  otherLocation: z.string().trim().max(120).optional(),
  country: z.string().trim().max(60).optional(),
})
  .refine((value) => value.location !== OTHER_LOCATION || (value.otherLocation ?? "").length >= 2, {
    message: "Enter your exact location",
    path: ["otherLocation"],
  })
  .refine((value) => value.location !== OTHER_LOCATION || (value.country ?? "").length >= 2, {
    message: "Enter your country of residence",
    path: ["country"],
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
        email: input.email,
        gender: input.gender,
        location:
          input.location === OTHER_LOCATION ? `${OTHER_LOCATION}: ${input.otherLocation}` : input.location,
        // A Lighthouse brings its own country; "Others" gives one.
        country:
          input.location === OTHER_LOCATION
            ? input.country
            : SGB_LOCATIONS.find((place) => place.name === input.location)?.country,
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
