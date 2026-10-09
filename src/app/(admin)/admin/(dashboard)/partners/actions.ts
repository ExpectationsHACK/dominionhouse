"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/components/admin/action-form";
import { audit } from "@/lib/audit";
import { FINANCE_ROLES, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { disableSubscription } from "@/lib/paystack";
import { LEGACY_RAISED_SETTING } from "@/lib/public-data";

/** The "Raised" figure on /give, in naira. Public pages pick it up within a minute. */
export async function setLegacyRaised(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);
  const value = Number(String(formData.get("raised") ?? "").replace(/[,\s₦]/g, ""));
  if (!Number.isFinite(value) || value < 0) return { error: "Enter the amount raised, in naira." };

  await db.setting.upsert({
    where: { key: LEGACY_RAISED_SETTING },
    create: { key: LEGACY_RAISED_SETTING, value: Math.round(value) },
    update: { value: Math.round(value) },
  });
  await audit({ actor: admin, action: "legacy.raised.updated", entity: "Setting", meta: { naira: value } });
  revalidatePath("/give");
  revalidatePath("/admin/partners");
  return { ok: `Raised so far is now ₦${Math.round(value).toLocaleString("en-NG")}.` };
}

/** Stop a partner's monthly charge (they asked to pause or end). */
export async function stopPartnership(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);
  const id = String(formData.get("partnerId") ?? "");
  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) return { error: "That partner wasn't found." };
  if (partner.status === "CANCELLED") return { ok: "That partnership is already stopped." };

  if (partner.paystackSubscriptionCode && partner.paystackEmailToken) {
    try {
      await disableSubscription(partner.paystackSubscriptionCode, partner.paystackEmailToken);
    } catch (error) {
      return {
        error: `Paystack didn't stop it: ${error instanceof Error ? error.message : "unknown error"}. Nothing was changed.`,
      };
    }
  }

  await db.partner.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  await audit({ actor: admin, action: "partner.stopped", entity: "Partner", entityId: id });
  revalidatePath("/admin/partners");
  return { ok: `${partner.name}'s monthly partnership is stopped; no further charges.` };
}
