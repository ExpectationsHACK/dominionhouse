"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { createManualRegistrant } from "@/lib/manual-registration";
import { adminRegistrantSchema } from "@/lib/validation";

export type ActionState = { ok?: string; error?: string };

export async function createRegistrantByAdmin(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const parsed = adminRegistrantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const result = await createManualRegistrant(camp, admin, parsed.data);
  if (!result.ok) return { error: result.error };

  await audit({
    actor: admin,
    action: "registrant.created-by-admin",
    entity: "Registrant",
    entityId: result.registrantId,
    meta: { registrationCode: result.registrationCode },
  });

  redirect(`/admin/registrants/${result.registrantId}?created=1`);
}
