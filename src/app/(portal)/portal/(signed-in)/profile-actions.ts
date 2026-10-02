"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRegistrant } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, phoneSchema } from "@/lib/validation";

export type CompleteProfileState = { ok?: boolean; error?: string; errors?: Record<string, string> };

const genderSchema = z.enum(["MALE", "FEMALE"], { message: "Select a gender" });
const emergencySchema = z.object({
  emergencyName: z.string().trim().min(2, "Enter an emergency contact name").max(80),
  emergencyPhone: phoneSchema,
  emergencyRelation: z.string().trim().max(60).optional().or(z.literal("")),
});

/**
 * The details an imported registration arrived without. Only what this
 * person is actually missing is asked for, or accepted: everything they gave
 * already stays as it is.
 */
export async function completeProfile(
  _previous: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const registrant = await requireRegistrant();
  const input = Object.fromEntries(formData);
  const needsGender = !registrant.gender;
  const needsEmergency = !registrant.emergencyName || !registrant.emergencyPhone;

  const gender = needsGender ? genderSchema.safeParse(input.gender) : null;
  const emergency = needsEmergency ? emergencySchema.safeParse(input) : null;

  const errors = {
    ...(gender && !gender.success ? { gender: gender.error.issues[0]?.message ?? "Select a gender" } : {}),
    ...(emergency && !emergency.success ? fieldErrors(emergency.error) : {}),
  };
  if (Object.keys(errors).length > 0) {
    return { error: "A couple of details need another look.", errors };
  }

  await db.registrant.update({
    where: { id: registrant.id },
    data: {
      ...(gender?.success ? { gender: gender.data } : {}),
      ...(emergency?.success
        ? {
            emergencyName: emergency.data.emergencyName,
            emergencyPhone: emergency.data.emergencyPhone,
            emergencyRelation: emergency.data.emergencyRelation || null,
          }
        : {}),
    },
  });

  revalidatePath("/portal");
  return { ok: true };
}
