"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/admin/action-form";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** Remove a Bootcamp sign-up (a duplicate, a test, or someone who asked). */
export async function deleteSgbRegistration(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const registration = await db.sgbRegistration.findUnique({ where: { id } });
  if (!registration) return { error: "That sign-up was already removed." };

  await db.sgbRegistration.delete({ where: { id } });
  await audit({
    actor: admin,
    action: "bootcamp.registration.deleted",
    entity: "SgbRegistration",
    entityId: id,
    meta: { name: `${registration.firstName} ${registration.lastName}` },
  });
  revalidatePath("/admin/bootcamp");
  return { ok: `${registration.firstName} ${registration.lastName} was removed.` };
}
