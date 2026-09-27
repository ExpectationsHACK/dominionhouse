import "server-only";
import { db } from "@/lib/db";
import { appUrl, requireActiveCamp } from "@/lib/camp";
import { paymentReference, registrationCode } from "@/lib/codes";
import { sendEmail } from "@/lib/email/send";
import { registrationReceivedEmail } from "@/lib/email/templates";
import { formatKobo, toKobo } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { settlePayment } from "@/lib/registration";
import type { AdminRegistrantInput } from "@/lib/validation";
import type { AdminSession } from "@/lib/session";
import type { Position } from "@/generated/prisma/enums";

export type ManualRegistrationResult =
  | { ok: true; registrantId: string; registrationCode: string }
  | { ok: false; error: string };

/**
 * Registers someone the way the desk does it: no internet, cash in hand, or
 * copied off a lighthouse coordinator's paper list. Shared by the single "Add
 * registrant" form and the CSV importer so both go through one validated path
 * instead of two copies drifting apart.
 */
export async function createManualRegistrant(
  camp: Awaited<ReturnType<typeof requireActiveCamp>>,
  admin: AdminSession,
  input: AdminRegistrantInput,
): Promise<ManualRegistrationResult> {
  const category = input.registeringAs;
  const lighthouse = category === "STUDENT" ? null : input.lighthouse || null;
  const region = category === "STUDENT" ? input.region || null : null;

  if (category === "STUDENT" && !region) {
    return { ok: false, error: "Choose a region for a campus student." };
  }
  if (category !== "STUDENT" && !lighthouse) {
    return { ok: false, error: "Choose a Lighthouse or Ministry." };
  }

  const tier = camp.priceTiers.find((priceTier) => priceTier.category === category);
  if (!tier) {
    return {
      ok: false,
      error: `There's no ${CATEGORY_LABEL[category].toLowerCase()} ticket on sale for this camp.`,
    };
  }

  const amountKobo = toKobo(input.amountPaidNaira ?? 0);
  if (amountKobo > tier.amountKobo) {
    return { ok: false, error: `${formatKobo(amountKobo)} is more than the ${formatKobo(tier.amountKobo)} ticket costs.` };
  }

  const existing = await db.registrant.findUnique({
    where: { campId_email: { campId: camp.id, email: input.email } },
  });
  if (existing) {
    return { ok: false, error: `${input.email} is already registered for ${camp.name}.` };
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
      paymentPlan: "FULL",
      consentPhoto: false,
      status: "PENDING",
      notes: "Registered by the camp desk.",
    },
  });

  if (input.sendEmail) {
    const { subject, html } = registrationReceivedEmail({
      firstName: registrant.firstName,
      registrationCode: registrant.registrationCode,
      category: tier.label,
      amountDue: tier.amountKobo,
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
  }

  if (amountKobo > 0) {
    const ref = input.paymentReference?.trim() || paymentReference("DHM");
    const clash = await db.payment.findUnique({ where: { reference: ref } });
    if (!clash) {
      await db.payment.create({
        data: {
          registrantId: registrant.id,
          reference: ref,
          amountKobo,
          method: input.paymentMethod ?? "CASH",
          status: "PENDING",
          note: `Recorded at registration by ${admin.name}.`,
          recordedById: admin.adminId,
        },
      });
      await settlePayment({
        reference: ref,
        paidAt: new Date(),
        channel: (input.paymentMethod ?? "CASH").toLowerCase(),
      });
    }
  }

  return { ok: true, registrantId: registrant.id, registrationCode: registrant.registrationCode };
}
