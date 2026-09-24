"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { appUrl, requireActiveCamp } from "@/lib/camp";
import { paymentReference } from "@/lib/codes";
import { initialiseTransaction } from "@/lib/paystack";
import { getTotals, minimumPayableKobo } from "@/lib/registration";
import { toKobo } from "@/lib/money";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { createPortalSession } from "@/lib/session";
import { phonesMatch } from "@/lib/utils";
import { payAmountSchema, portalLoginSchema } from "@/lib/validation";

export type LookupState = { error?: string };

/**
 * The gate. Email + phone in, the same credentials as the portal, so this
 * doubles as a sign-in: the device is remembered afterwards just like a
 * portal login. Redirecting keeps the result shareable and survives a
 * refresh.
 */
export async function lookupRegistration(
  _previous: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const parsed = portalLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  }

  const { email, phone } = parsed.data;

  const limited = await checkLoginRateLimit(email, { max: 8, windowMs: 15 * 60 * 1000 });
  if (limited) return { error: limited };

  const camp = await requireActiveCamp();

  const registrant = await db.registrant.findUnique({
    where: { campId_email: { campId: camp.id, email } },
  });

  // One message whether the email is unknown or the phone is wrong, so this
  // can't be used to find out who is registered.
  const noMatch = {
    error: "That email and phone number don't match a registration. Check both, or register first.",
  };

  if (!registrant) return noMatch;
  if (!phonesMatch(registrant.phone, phone)) return noMatch;
  if (registrant.status === "CANCELLED") {
    return { error: "This registration has been cancelled. Please contact the camp desk." };
  }

  await createPortalSession({ registrantId: registrant.id, email: registrant.email });
  redirect(`/camp/payment?email=${encodeURIComponent(registrant.email)}`);
}

export type PayState = { error?: string };

export async function startPayment(_previous: PayState, formData: FormData): Promise<PayState> {
  const parsed = payAmountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "That amount doesn't look right." };
  }

  const camp = await requireActiveCamp();
  const registrant = await db.registrant.findUnique({
    where: { id: parsed.data.registrantId },
    include: { payments: true },
  });

  if (!registrant || registrant.campId !== camp.id) {
    return { error: "We couldn't find that registration." };
  }
  if (registrant.status === "CANCELLED") {
    return { error: "This registration has been cancelled. Please contact the camp desk." };
  }

  const totals = await getTotals(registrant.id);
  if (totals.balanceKobo <= 0) {
    redirect(`/camp/payment?email=${encodeURIComponent(registrant.email)}&settled=1`);
  }

  const minimum = minimumPayableKobo(camp, totals);

  const amountKobo =
    parsed.data.mode === "FULL"
      ? totals.balanceKobo
      : toKobo(Math.floor(parsed.data.amountNaira ?? 0));

  if (amountKobo < minimum) {
    return {
      error: `The smallest payment we can take right now is ₦${(minimum / 100).toLocaleString("en-NG")}.`,
    };
  }
  if (amountKobo > totals.balanceKobo) {
    return { error: "That's more than the outstanding balance." };
  }

  const reference = paymentReference();

  await db.payment.create({
    data: {
      registrantId: registrant.id,
      reference,
      amountKobo,
      method: "PAYSTACK",
      status: "PENDING",
    },
  });

  let authorizationUrl: string;
  try {
    ({ authorizationUrl } = await initialiseTransaction({
      email: registrant.email,
      amountKobo,
      reference,
      callbackUrl: appUrl("/camp/payment/callback"),
      metadata: {
        registrationCode: registrant.registrationCode,
        campId: camp.id,
        name: `${registrant.firstName} ${registrant.lastName}`,
      },
    }));
  } catch (error) {
    // The attempt is still part of the record: keep it, with the reason.
    await db.payment.update({
      where: { reference },
      data: {
        status: "FAILED",
        note: `Could not start checkout: ${error instanceof Error ? error.message : "unknown error"}`,
      },
    });
    return { error: "We couldn't reach the payment provider. Nothing was charged, please try again." };
  }

  redirect(authorizationUrl);
}
