import "server-only";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/camp";
import { qrPayload, ticketCode } from "@/lib/codes";
import { sendEmail } from "@/lib/email/send";
import { paymentReceiptEmail, ticketEmail } from "@/lib/email/templates";
import { SETTLEABLE_STATUSES } from "@/lib/payment-outcome";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { effectiveMinimumKobo, perInstallmentKobo } from "@/lib/money";
import type { PaymentStatus, RegistrationStatus } from "@/generated/prisma/enums";

export type Totals = {
  dueKobo: number;
  paidKobo: number;
  balanceKobo: number;
  isSettled: boolean;
};

/** Only SUCCESS payments count toward a balance. Pending never does. */
export function totalsFor(registrant: {
  amountDueKobo: number;
  payments: { amountKobo: number; status: string }[];
}): Totals {
  const paidKobo = registrant.payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amountKobo, 0);
  const balanceKobo = Math.max(0, registrant.amountDueKobo - paidKobo);
  return {
    dueKobo: registrant.amountDueKobo,
    paidKobo,
    balanceKobo,
    // A zero-fee ticket (comped, fully waived) is settled from the start,
    // not stuck "unpaid" forever for having nothing left to pay.
    isSettled: paidKobo >= registrant.amountDueKobo,
  };
}

export async function getTotals(registrantId: string): Promise<Totals> {
  const registrant = await db.registrant.findUniqueOrThrow({
    where: { id: registrantId },
    select: { amountDueKobo: true, payments: { select: { amountKobo: true, status: true } } },
  });
  return totalsFor(registrant);
}

export function statusFor(totals: Totals, current: RegistrationStatus): RegistrationStatus {
  if (current === "CANCELLED" || current === "WAITLISTED") return current;
  if (totals.isSettled) return "PAID";
  if (totals.paidKobo > 0) return "PARTIALLY_PAID";
  return "PENDING";
}

/**
 * Issue the ticket for a registrant. Idempotent, a second call returns the
 * existing ticket rather than minting a new code.
 */
export async function issueTicket(registrantId: string) {
  const existing = await db.ticket.findUnique({ where: { registrantId } });
  if (existing) return existing;

  try {
    return await db.ticket.create({
      data: {
        registrantId,
        code: ticketCode(),
        qrPayload: qrPayload(),
        status: "VALID",
      },
    });
  } catch (error) {
    // Lost a race with another concurrent issue for the same registrant
    // (Ticket.registrantId is unique) — the winner's row is the real ticket.
    if ((error as { code?: string }).code === "P2002") {
      const winner = await db.ticket.findUnique({ where: { registrantId } });
      if (winner) return winner;
    }
    throw error;
  }
}

export async function ticketQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#0b0b0cff", light: "#ffffffff" },
  });
}

export async function sendTicketEmail(registrantId: string) {
  const registrant = await db.registrant.findUniqueOrThrow({
    where: { id: registrantId },
    include: { ticket: true, roomAssignment: { include: { room: true } } },
  });
  if (!registrant.ticket) return;

  const qrDataUrl = await ticketQrDataUrl(registrant.ticket.qrPayload);

  const { subject, html } = ticketEmail({
    firstName: registrant.firstName,
    lastName: registrant.lastName,
    ticketCode: registrant.ticket.code,
    category: CATEGORY_LABEL[registrant.category],
    registrationCode: registrant.registrationCode,
    qrDataUrl,
    portalUrl: appUrl("/portal"),
    room: registrant.roomAssignment
      ? {
          block: registrant.roomAssignment.room.block,
          name: registrant.roomAssignment.room.name,
          bedLabel: registrant.roomAssignment.bedLabel,
        }
      : null,
  });

  const result = await sendEmail({
    to: registrant.email,
    subject,
    html,
    template: "ticket",
    registrantId,
  });

  if (result.ok) {
    await db.ticket.update({
      where: { id: registrant.ticket.id },
      data: { emailSentAt: new Date() },
    });
  }
}

/**
 * The single place a payment becomes real.
 *
 * Called from the Paystack callback, the Paystack webhook, and the admin's
 * "record offline payment" action, all three converge here, and all three are
 * safe to call twice for the same reference — including two calls arriving at
 * the same instant, since the SUCCESS transition below is a single atomic
 * conditional update, not a read-then-write. Only whichever call actually
 * flips the row (`claimed`) runs the one-time work; a racing duplicate sees
 * `claimed: false` and falls straight through to `alreadySettled`.
 *
 * On settlement it issues the ticket and emails it. Rooms are assigned by
 * hand from the admin, never automatically here.
 */
export async function settlePayment(args: {
  reference: string;
  paidAt?: Date | null;
  channel?: string | null;
  gatewayRaw?: unknown;
  /** Provider-reported amount in kobo; ignored when negative (mock mode). */
  verifiedAmountKobo?: number;
}) {
  const payment = await db.payment.findUnique({
    where: { reference: args.reference },
    include: { registrant: true },
  });

  if (!payment) return { ok: false as const, reason: "unknown-reference" };

  const amountKobo =
    typeof args.verifiedAmountKobo === "number" &&
    args.verifiedAmountKobo >= 0 &&
    args.verifiedAmountKobo !== payment.amountKobo
      ? args.verifiedAmountKobo
      : payment.amountKobo;

  // Atomic compare-and-swap: only succeeds for whichever concurrent caller
  // gets here first while the row is still open. "Open" includes FAILED,
  // DECLINED and ABANDONED: a browser callback can record one of those a
  // moment before the gateway's success webhook arrives, and a payment the
  // provider confirms as successful must still settle. A transaction wrapper
  // around a read-then-write wouldn't close this race under READ COMMITTED;
  // a single conditional UPDATE is itself the lock.
  const claim = await db.payment.updateMany({
    where: { reference: args.reference, status: { in: SETTLEABLE_STATUSES } },
    data: {
      status: "SUCCESS",
      amountKobo,
      paidAt: args.paidAt ?? new Date(),
      channel: args.channel ?? payment.channel,
      gatewayRaw: (args.gatewayRaw as never) ?? undefined,
      note:
        amountKobo !== payment.amountKobo
          ? [payment.note, "Amount adjusted to provider-verified value."].filter(Boolean).join(" ")
          : payment.note,
    },
  });

  const claimed = claim.count > 0;

  const registrantId = payment.registrantId;
  const totals = await getTotals(registrantId);
  const fresh = await db.registrant.findUniqueOrThrow({ where: { id: registrantId } });
  const nextStatus = statusFor(totals, fresh.status);

  if (nextStatus !== fresh.status) {
    await db.registrant.update({ where: { id: registrantId }, data: { status: nextStatus } });
  }

  // Everything below is one-time-only work, and only the caller that actually
  // won the claim above may run it.
  if (!claimed) {
    return { ok: true as const, alreadySettled: true, totals };
  }

  await sendReceipt(registrantId, amountKobo, payment.reference, totals);

  if (totals.isSettled) {
    await issueTicket(registrantId);
    await sendTicketEmail(registrantId);
  }

  return { ok: true as const, alreadySettled: false, totals };
}

/**
 * Keep a record of an attempt that did not succeed, with the reason.
 *
 * Never touches a SUCCESS row, and never a REVERSED one, so a late or repeated
 * failure notice can't overwrite money that actually landed.
 */
export async function recordUnsuccessfulPayment(args: {
  reference: string;
  status: Extract<PaymentStatus, "FAILED" | "DECLINED" | "ABANDONED" | "REVERSED">;
  note: string;
  gatewayRaw?: unknown;
}) {
  const from: PaymentStatus[] =
    args.status === "REVERSED" ? ["SUCCESS", ...SETTLEABLE_STATUSES] : SETTLEABLE_STATUSES;

  const result = await db.payment.updateMany({
    where: { reference: args.reference, status: { in: from } },
    data: {
      status: args.status,
      note: args.note,
      gatewayRaw: (args.gatewayRaw as never) ?? undefined,
    },
  });
  return result.count > 0;
}

async function sendReceipt(
  registrantId: string,
  amountKobo: number,
  reference: string,
  totals: Totals,
) {
  const registrant = await db.registrant.findUniqueOrThrow({ where: { id: registrantId } });
  const { subject, html } = paymentReceiptEmail({
    firstName: registrant.firstName,
    amountPaid: amountKobo,
    totalPaid: totals.paidKobo,
    amountDue: totals.dueKobo,
    balance: totals.balanceKobo,
    reference,
    portalUrl: appUrl(totals.isSettled ? "/portal" : "/camp/payment"),
  });

  await sendEmail({ to: registrant.email, subject, html, template: "payment-receipt", registrantId });
}

/** Smallest payment we will accept right now, honouring the first-instalment rule. */
export function minimumPayableKobo(
  camp: { installmentsEnabled: boolean; minFirstInstallmentKobo: number },
  totals: Totals,
) {
  if (!camp.installmentsEnabled) return totals.balanceKobo;
  if (totals.paidKobo > 0) return Math.min(100_00, totals.balanceKobo); // ₦100 floor on top-ups
  return Math.min(
    effectiveMinimumKobo(camp.minFirstInstallmentKobo, totals.dueKobo),
    totals.balanceKobo,
  );
}

// ── instalment plans ─────────────────────────────────────────────────────────

export type InstallmentPlan = {
  /** Even split across this many payments, when they picked one. */
  count: number | null;
  /** What we suggest they pay next, in kobo. */
  suggestedKobo: number;
  /** 1-based position in the plan, for "instalment 2 of 3". */
  paidCount: number;
  perInstalmentKobo: number | null;
};

/**
 * What to put in front of someone returning to pay.
 *
 * The plan is a suggestion, never a constraint, they can always pay more or
 * less, down to the camp's minimum. It exists so the common case is one click.
 */
export function installmentPlanFor(
  registrant: {
    paymentPlan: string;
    installmentCount: number | null;
    firstInstallmentKobo: number | null;
    amountDueKobo: number;
  },
  totals: Totals,
  minimumKobo: number,
): InstallmentPlan {
  const paidCount = totals.paidKobo > 0 ? Math.max(1, Math.round(totals.paidKobo / Math.max(1, registrant.firstInstallmentKobo ?? 1))) : 0;

  if (registrant.paymentPlan !== "INSTALLMENT" || totals.balanceKobo <= 0) {
    return { count: null, suggestedKobo: totals.balanceKobo, paidCount: 0, perInstalmentKobo: null };
  }

  // An even split across the chosen number of payments.
  if (registrant.installmentCount && registrant.installmentCount > 1) {
    const per = perInstallmentKobo(registrant.amountDueKobo, registrant.installmentCount);
    const done = Math.min(registrant.installmentCount, Math.floor(totals.paidKobo / per));
    return {
      count: registrant.installmentCount,
      perInstalmentKobo: per,
      paidCount: done,
      suggestedKobo: Math.min(Math.max(per, minimumKobo), totals.balanceKobo),
    };
  }

  // They named their own first amount; it only applies while nothing is paid.
  if (registrant.firstInstallmentKobo && totals.paidKobo === 0) {
    return {
      count: null,
      perInstalmentKobo: null,
      paidCount: 0,
      suggestedKobo: Math.min(Math.max(registrant.firstInstallmentKobo, minimumKobo), totals.balanceKobo),
    };
  }

  return {
    count: null,
    perInstalmentKobo: null,
    paidCount: paidCount > 0 ? 1 : 0,
    suggestedKobo: Math.min(Math.max(minimumKobo, 0), totals.balanceKobo) || totals.balanceKobo,
  };
}
