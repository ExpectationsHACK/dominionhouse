import "server-only";
import { appUrl } from "@/lib/camp";
import { paymentReference } from "@/lib/codes";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { giftReceiptEmail } from "@/lib/email/templates";
import { GIFT_REFERENCE_PREFIX, formatMoney } from "@/lib/giving-rules";
import { createMonthlyPlan, isMockPayments } from "@/lib/paystack";

/**
 * Angel Partners: monthly partnerships run as Paystack subscriptions, plus
 * one-time seeds. Every charge becomes a Gift row; a Partner row mirrors the
 * subscription's state. Callback, webhook and admin all converge here, and
 * each step is safe to run twice (Paystack retries webhooks).
 */

export const newGiftReference = () => paymentReference(GIFT_REFERENCE_PREFIX);

/**
 * The Paystack plan for a monthly amount, created the first time anyone picks
 * that amount. Plans are reused, so the dashboard doesn't fill with duplicates.
 */
export async function planFor(currency: string, amountMinor: number): Promise<string> {
  const existing = await db.givingPlan.findUnique({
    where: { currency_amountMinor: { currency, amountMinor } },
  });
  if (existing) return existing.planCode;

  const planCode = await createMonthlyPlan({
    name: `Angel Partner ${formatMoney(amountMinor, currency)} monthly`,
    amountMinor,
    currency,
  });
  // A simulated plan must never be saved: development shares this database,
  // and a stored fake plan code would be handed to real partners later.
  if (isMockPayments) return planCode;
  try {
    await db.givingPlan.create({ data: { currency, amountMinor, planCode } });
  } catch (error) {
    // Two partners picked a new amount at the same moment: keep the first plan.
    if ((error as { code?: string }).code === "P2002") {
      const winner = await db.givingPlan.findUnique({
        where: { currency_amountMinor: { currency, amountMinor } },
      });
      if (winner) return winner.planCode;
    }
    throw error;
  }
  return planCode;
}

/**
 * A payment Paystack confirmed for a reference we issued (the first month of a
 * partnership, or a one-time seed). Only the call that flips the row from
 * PENDING sends the receipt.
 */
export async function settleGift(args: {
  reference: string;
  paidAt?: Date | null;
  channel?: string | null;
  amountMinor?: number;
  raw?: unknown;
}) {
  const gift = await db.gift.findUnique({ where: { reference: args.reference } });
  if (!gift) return { ok: false as const, reason: "unknown-reference" };

  const claim = await db.gift.updateMany({
    where: { reference: args.reference, status: { in: ["PENDING", "FAILED"] } },
    data: {
      status: "SUCCESS",
      paidAt: args.paidAt ?? new Date(),
      channel: args.channel ?? gift.channel,
      ...(typeof args.amountMinor === "number" && args.amountMinor > 0
        ? { amountMinor: args.amountMinor }
        : {}),
      gatewayRaw: (args.raw as never) ?? undefined,
    },
  });

  if (gift.partnerId) {
    await db.partner.updateMany({
      where: { id: gift.partnerId, status: "PENDING" },
      data: { status: "ACTIVE" },
    });
  }

  if (claim.count > 0) {
    await sendGiftReceipt(gift.id, { firstMonth: gift.kind === "MONTHLY" });
  }
  return { ok: true as const, alreadySettled: claim.count === 0 };
}

export async function failGift(reference: string, note: string, raw?: unknown) {
  await db.gift.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "FAILED", note, gatewayRaw: (raw as never) ?? undefined },
  });
}

type PaystackCharge = {
  reference?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  paid_at?: string;
  plan?: { plan_code?: string } | string | null;
  customer?: { email?: string; customer_code?: string };
};

const planCodeOf = (plan: PaystackCharge["plan"]) =>
  typeof plan === "string" ? plan : (plan?.plan_code ?? null);

/**
 * A monthly renewal: Paystack charges the card itself and uses its own
 * reference, so the partner is found by email and plan instead.
 */
export async function recordRenewal(charge: PaystackCharge) {
  const reference = charge.reference;
  const planCode = planCodeOf(charge.plan);
  const email = charge.customer?.email?.toLowerCase();
  if (!reference || !planCode || !email) return { ok: false as const, reason: "not-a-renewal" };

  const partner = await db.partner.findFirst({
    where: { email, paystackPlanCode: planCode, status: { in: ["ACTIVE", "PENDING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!partner) return { ok: false as const, reason: "unknown-partner" };

  try {
    const gift = await db.gift.create({
      data: {
        partnerId: partner.id,
        reference,
        kind: "MONTHLY",
        status: "SUCCESS",
        currency: charge.currency ?? partner.currency,
        amountMinor: charge.amount ?? partner.amountMinor,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        channel: charge.channel ?? null,
        paidAt: charge.paid_at ? new Date(charge.paid_at) : new Date(),
        gatewayRaw: charge as never,
      },
    });
    await db.partner.update({ where: { id: partner.id }, data: { status: "ACTIVE" } });
    await sendGiftReceipt(gift.id, { firstMonth: false });
    return { ok: true as const };
  } catch (error) {
    // Paystack delivered the same renewal twice: already recorded.
    if ((error as { code?: string }).code === "P2002") return { ok: true as const, duplicate: true };
    throw error;
  }
}

type PaystackSubscription = {
  subscription_code?: string;
  email_token?: string;
  plan?: { plan_code?: string } | string | null;
  customer?: { email?: string; customer_code?: string };
};

/** The subscription exists: keep the codes needed to manage it later. */
export async function onSubscriptionCreated(subscription: PaystackSubscription) {
  const code = subscription.subscription_code;
  const planCode = planCodeOf(subscription.plan);
  const email = subscription.customer?.email?.toLowerCase();
  if (!code || !planCode || !email) return;

  const already = await db.partner.findUnique({ where: { paystackSubscriptionCode: code } });
  if (already) return;

  const partner = await db.partner.findFirst({
    where: { email, paystackPlanCode: planCode, paystackSubscriptionCode: null },
    orderBy: { createdAt: "desc" },
  });
  if (!partner) return;

  await db.partner.update({
    where: { id: partner.id },
    data: {
      paystackSubscriptionCode: code,
      paystackEmailToken: subscription.email_token ?? null,
      paystackCustomerCode: subscription.customer?.customer_code ?? null,
      status: "ACTIVE",
    },
  });
}

/** Paystack stopped the subscription (cancelled, or it won't renew). */
export async function onSubscriptionEnded(subscription: PaystackSubscription) {
  if (!subscription.subscription_code) return;
  await db.partner.updateMany({
    where: { paystackSubscriptionCode: subscription.subscription_code, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

async function sendGiftReceipt(giftId: string, options: { firstMonth: boolean }) {
  const gift = await db.gift.findUnique({ where: { id: giftId } });
  if (!gift) return;
  const { subject, html } = giftReceiptEmail({
    firstName: gift.name.split(/\s+/)[0] || gift.name,
    amount: formatMoney(gift.amountMinor, gift.currency),
    reference: gift.reference,
    monthly: gift.kind === "MONTHLY",
    firstMonth: options.firstMonth,
    giveUrl: appUrl("/give"),
  });
  await sendEmail({ to: gift.email, subject, html, template: "gift-receipt" });
}

/** Totals for the admin and the page: successful gifts, per currency. */
export async function givingTotals() {
  const [byCurrency, activePartners] = await Promise.all([
    db.gift.groupBy({
      by: ["currency"],
      where: { status: "SUCCESS" },
      _sum: { amountMinor: true },
      _count: true,
    }),
    db.partner.count({ where: { status: "ACTIVE" } }),
  ]);
  return {
    activePartners,
    byCurrency: byCurrency.map((row) => ({
      currency: row.currency,
      totalMinor: row._sum.amountMinor ?? 0,
      count: row._count,
    })),
  };
}
