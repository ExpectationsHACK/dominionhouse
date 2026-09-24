"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { appUrl, requireActiveCamp, registrationIsOpen } from "@/lib/camp";
import { registrationCode } from "@/lib/codes";
import { sendEmail } from "@/lib/email/send";
import { registrationReceivedEmail } from "@/lib/email/templates";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { effectiveMinimumKobo, formatKobo, perInstallmentKobo, toKobo } from "@/lib/money";
import { createPortalSession } from "@/lib/session";
import { fieldErrors, registrationSchema } from "@/lib/validation";
import type { Position } from "@/generated/prisma/enums";

export type RegisterState = {
  ok: boolean;
  error?: string;
  errors?: Record<string, string>;
  duplicateEmail?: string;
};

export async function registerForCamp(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const camp = await requireActiveCamp();

  if (!registrationIsOpen(camp)) {
    return { ok: false, error: `Registration for ${camp.name} is closed.` };
  }

  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some details need another look.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  // The registrant chooses the ticket; the price is looked up from that
  // category on the server, never taken from the client.
  const category = input.registeringAs;

  // Whichever of the two was asked for; the other stays empty.
  const lighthouse = input.registeringAs === "STUDENT" ? null : input.lighthouse || null;
  const region = input.registeringAs === "STUDENT" ? input.region || null : null;

  if (input.registeringAs === "STUDENT" && !region) {
    return { ok: false, error: "Choose your region.", errors: { region: "Pick a region" } };
  }
  if (input.registeringAs !== "STUDENT" && !lighthouse) {
    return {
      ok: false,
      error: "Choose a Lighthouse or Ministry.",
      errors: { lighthouse: "Pick a Lighthouse or Ministry" },
    };
  }
  const tier = camp.priceTiers.find((priceTier) => priceTier.category === category);

  if (!tier) {
    return {
      ok: false,
      error: `There's no ${CATEGORY_LABEL[category].toLowerCase()} ticket on sale for this camp. Please contact the camp desk.`,
    };
  }

  // ── instalment plan ────────────────────────────────────────────────────────
  let installmentCount: number | null = null;
  let firstInstallmentKobo: number | null = null;

  if (input.paymentPlan === "INSTALLMENT") {
    if (!camp.installmentsEnabled) {
      return { ok: false, error: "Instalments aren't available for this camp." };
    }

    const minimumKobo = effectiveMinimumKobo(camp.minFirstInstallmentKobo, tier.amountKobo);

    if (input.installmentChoice === "CUSTOM") {
      const amountKobo = toKobo(input.customFirstAmountNaira ?? 0);
      if (amountKobo < minimumKobo) {
        return {
          ok: false,
          error: `The smallest first instalment is ${formatKobo(minimumKobo)}.`,
          errors: { customFirstAmountNaira: "Too small" },
        };
      }
      if (amountKobo > tier.amountKobo) {
        return {
          ok: false,
          error: "That's more than the ticket costs, choose to pay in full instead.",
          errors: { customFirstAmountNaira: "More than the total" },
        };
      }
      firstInstallmentKobo = amountKobo;
    } else if (input.installmentChoice) {
      const count = Number(input.installmentChoice);
      const per = perInstallmentKobo(tier.amountKobo, count);
      if (per < minimumKobo) {
        return {
          ok: false,
          error: `Splitting ${formatKobo(tier.amountKobo)} ${count} ways is below the ${formatKobo(minimumKobo)} minimum per payment.`,
          errors: { installmentChoice: "Too many instalments for this ticket" },
        };
      }
      installmentCount = count;
    } else {
      return {
        ok: false,
        error: "Choose how you'd like to split the payments.",
        errors: { installmentChoice: "Pick an option" },
      };
    }
  }

  const existing = await db.registrant.findUnique({
    where: { campId_email: { campId: camp.id, email: input.email } },
  });

  if (existing) {
    return {
      ok: false,
      error: `${input.email} is already registered for ${camp.name}.`,
      duplicateEmail: input.email,
    };
  }

  const registrant = await db.registrant.create({
    data: {
      campId: camp.id,
      registrationCode: registrationCode(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      position: input.position as Position,
      branch: input.branch || null,
      lighthouse,
      region,
      isFirstCamp: Boolean(input.isFirstCamp),
      city: input.city || null,
      state: input.state || null,
      emergencyName: input.emergencyName,
      emergencyPhone: input.emergencyPhone,
      emergencyRelation: input.emergencyRelation || null,
      medicalNotes: input.medicalNotes || null,
      allergies: input.allergies || null,
      category,
      priceTierId: tier.id,
      amountDueKobo: tier.amountKobo,
      wantsPersonalAccommodation: Boolean(input.wantsPersonalAccommodation),
      transportNeeded: Boolean(input.transportNeeded),
      paymentPlan: input.paymentPlan,
      installmentCount,
      firstInstallmentKobo,
      consentPhoto: Boolean(input.consentPhoto),
      status: "PENDING",
    },
  });

  const { subject, html } = registrationReceivedEmail({
    firstName: registrant.firstName,
    registrationCode: registrant.registrationCode,
    category: tier.label,
    amountDue: tier.amountKobo,
    paymentUrl: appUrl(`/camp/payment?email=${encodeURIComponent(registrant.email)}`),
  });

  await sendEmail({
    to: registrant.email,
    subject,
    html,
    template: "registration-received",
    registrantId: registrant.id,
  });

  // The device they registered on is now their camp profile's device, no
  // separate sign-in needed until the cookie expires or they switch profiles.
  await createPortalSession({ registrantId: registrant.id, email: registrant.email });

  redirect(`/camp/payment?email=${encodeURIComponent(registrant.email)}&welcome=1`);
}
