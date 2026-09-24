"use server";

import { db } from "@/lib/db";
import { fieldErrors, visitorSchema } from "@/lib/validation";

export type VisitState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  firstName?: string;
};

export async function planAVisit(_previous: VisitState, formData: FormData): Promise<VisitState> {
  const parsed = visitorSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: "Some details need another look.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  await db.visitor.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      campus: input.campus || null,
      visitDate: input.visitDate ? new Date(input.visitDate) : null,
      howHeard: input.howHeard || null,
      prayerRequest: input.prayerRequest || null,
      wantsFollowUp: formData.get("wantsFollowUp") !== null,
    },
  });

  return { ok: true, firstName: input.firstName };
}
