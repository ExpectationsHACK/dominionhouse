"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { toKobo } from "@/lib/money";
import { pricingSchema } from "@/lib/validation";
import type { AgeCategory } from "@/generated/prisma/enums";

export type SettingsState = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/admin/settings");
  revalidatePath("/camp");
  revalidatePath("/camp/register");
  revalidatePath("/");
}

/**
 * Repricing only changes what new registrations cost. Existing registrants keep
 * the amount they agreed to, the desk can reprice individuals if it needs to.
 */
export async function savePricing(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await requireAdmin(["SUPER_ADMIN", "ADMIN"]);
  const camp = await requireActiveCamp();

  const parsed = pricingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the prices." };
  }

  const amounts: Record<AgeCategory, number> = {
    ADULT: toKobo(parsed.data.adult),
    STUDENT: toKobo(parsed.data.student),
    TEEN: toKobo(parsed.data.teen),
    CHILD: toKobo(parsed.data.child),
  };

  for (const [category, amountKobo] of Object.entries(amounts)) {
    await db.priceTier.update({
      where: { campId_category: { campId: camp.id, category: category as AgeCategory } },
      data: { amountKobo },
    });
  }

  await db.camp.update({
    where: { id: camp.id },
    data: {
      installmentsEnabled: Boolean(parsed.data.installmentsEnabled),
      minFirstInstallmentKobo: toKobo(parsed.data.minFirstInstallmentNaira),
      requireFullPayForRoom: Boolean(parsed.data.requireFullPayForRoom),
    },
  });

  await audit({ actor: admin, action: "settings.pricing", entity: "Camp", entityId: camp.id, meta: amounts });

  refresh();
  return { ok: "Saved. New registrations use these prices from now on." };
}

export async function saveCampDetails(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await requireAdmin(["SUPER_ADMIN", "ADMIN"]);
  const camp = await requireActiveCamp();

  const name = String(formData.get("name") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const venueAddress = String(formData.get("venueAddress") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const registrationClosesAt = String(formData.get("registrationClosesAt") ?? "").trim();

  if (!name || !venue) return { error: "The camp needs a name and a venue." };

  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacityRaw && (!Number.isFinite(capacity!) || capacity! < 1)) {
    return { error: "Capacity has to be a whole number." };
  }

  await db.camp.update({
    where: { id: camp.id },
    data: {
      name,
      theme: theme || null,
      tagline: tagline || null,
      description: description || null,
      venue,
      venueAddress: venueAddress || null,
      capacity,
      registrationClosesAt: registrationClosesAt
        ? new Date(`${registrationClosesAt}T23:59:00+01:00`)
        : null,
    },
  });

  await audit({ actor: admin, action: "settings.camp", entity: "Camp", entityId: camp.id });

  refresh();
  return { ok: "Camp details updated." };
}
