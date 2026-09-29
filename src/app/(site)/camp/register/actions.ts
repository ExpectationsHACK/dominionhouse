"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { appUrl, requireActiveCamp, registrationIsOpen } from "@/lib/camp";
import { registrationCode } from "@/lib/codes";
import { sendEmail } from "@/lib/email/send";
import { registrationReceivedEmail } from "@/lib/email/templates";
import { amountDueKobo, CATEGORY_LABEL } from "@/lib/pricing";
import { effectiveMinimumKobo, formatKobo, perInstallmentKobo, toKobo } from "@/lib/money";
import { issueTicket, sendTicketEmail } from "@/lib/registration";
import { createPortalSession } from "@/lib/session";
import { fieldErrors, registrationSchema } from "@/lib/validation";
import type { AgeGroup, MaritalStatus, HowHeard, Position } from "@/generated/prisma/enums";

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

  if (category === "ADULT" && (!input.ageGroup || !input.maritalStatus)) {
    return {
      ok: false,
      error: "Choose your age group and marital status.",
      errors: {
        ...(!input.ageGroup ? { ageGroup: "Pick an age group" } : {}),
        ...(!input.maritalStatus ? { maritalStatus: "Pick one" } : {}),
      },
    };
  }
  if (category === "CHILD" && input.childAgeYears === undefined) {
    return { ok: false, error: "Enter the child's age.", errors: { childAgeYears: "Enter an age" } };
  }

  const childTier = camp.priceTiers.find((priceTier) => priceTier.category === "CHILD");
  const childFeeKobo = childTier?.amountKobo ?? 15_000_00;
  const bringingChildren = category === "ADULT" && Boolean(input.bringingChildren);
  const childrenUnder5 = bringingChildren ? (input.childrenUnder5 ?? 0) : 0;
  const children5to11 = bringingChildren ? (input.children5to11 ?? 0) : 0;

  const finalAmountKobo = amountDueKobo({
    category,
    tierAmountKobo: tier.amountKobo,
    lighthouse,
    childAgeYears: category === "CHILD" ? (input.childAgeYears ?? null) : null,
    bringingChildren,
    children5to11,
    childFeeKobo,
  });

  // ── instalment plan ────────────────────────────────────────────────────────
  let installmentCount: number | null = null;
  let firstInstallmentKobo: number | null = null;
  const paymentPlan = finalAmountKobo === 0 ? "FULL" : input.paymentPlan;

  if (finalAmountKobo > 0 && paymentPlan === "INSTALLMENT") {
    if (!camp.installmentsEnabled) {
      return { ok: false, error: "Instalments aren't available for this camp." };
    }

    const minimumKobo = effectiveMinimumKobo(camp.minFirstInstallmentKobo, finalAmountKobo);

    if (input.installmentChoice === "CUSTOM") {
      const amountKobo = toKobo(input.customFirstAmountNaira ?? 0);
      if (amountKobo < minimumKobo) {
        return {
          ok: false,
          error: `The smallest first instalment is ${formatKobo(minimumKobo)}.`,
          errors: { customFirstAmountNaira: "Too small" },
        };
      }
      if (amountKobo > finalAmountKobo) {
        return {
          ok: false,
          error: "That's more than the ticket costs, choose to pay in full instead.",
          errors: { customFirstAmountNaira: "More than the total" },
        };
      }
      firstInstallmentKobo = amountKobo;
    } else if (input.installmentChoice) {
      const count = Number(input.installmentChoice);
      const per = perInstallmentKobo(finalAmountKobo, count);
      if (per < minimumKobo) {
        return {
          ok: false,
          error: `Splitting ${formatKobo(finalAmountKobo)} ${count} ways is below the ${formatKobo(minimumKobo)} minimum per payment.`,
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
      amountDueKobo: finalAmountKobo,
      age: category === "CHILD" ? (input.childAgeYears ?? null) : null,
      ageGroup: category === "ADULT" ? ((input.ageGroup || null) as AgeGroup | null) : null,
      maritalStatus: category === "ADULT" ? ((input.maritalStatus || null) as MaritalStatus | null) : null,
      howHeard: input.howHeard as HowHeard,
      bringingChildren,
      childrenUnder5,
      children5to11,
      wantsPersonalAccommodation: Boolean(input.wantsPersonalAccommodation),
      transportNeeded: Boolean(input.transportNeeded),
      paymentPlan,
      installmentCount,
      firstInstallmentKobo,
      consentPhoto: Boolean(input.consentPhoto),
      status: finalAmountKobo === 0 ? "PAID" : "PENDING",
    },
  });

  // The device they registered on is now their camp profile's device, no
  // separate sign-in needed until the cookie expires or they switch profiles.
  await createPortalSession({ registrantId: registrant.id, email: registrant.email });

  // Free ticket, Guest lighthouse or an under-5 child: nothing to pay, so the
  // ticket issues immediately instead of waiting on a payment that never comes.
  if (finalAmountKobo === 0) {
    await issueTicket(registrant.id);
    await sendTicketEmail(registrant.id);
    redirect("/portal?joined=1");
  }

  const { subject, html } = registrationReceivedEmail({
    firstName: registrant.firstName,
    registrationCode: registrant.registrationCode,
    category: tier.label,
    amountDue: finalAmountKobo,
    paymentUrl: appUrl(`/camp/payment?email=${encodeURIComponent(registrant.email)}`),
    portalUrl: appUrl("/portal"),
  });

  await sendEmail({
    to: registrant.email,
    subject,
    html,
    template: "registration-received",
    registrantId: registrant.id,
  });

  // "Pay later" registers the same way but goes straight to the camp profile.
  if (formData.get("payLater") === "1") redirect("/portal?joined=1");

  redirect(`/camp/payment?email=${encodeURIComponent(registrant.email)}&welcome=1`);
}
