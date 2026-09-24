/**
 * All money in this system is stored as an integer number of KOBO.
 * Never store or compute money as a float.
 */

export const KOBO = 100;

export function toKobo(naira: number): number {
  return Math.round(naira * KOBO);
}

export function toNaira(kobo: number): number {
  return kobo / KOBO;
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const preciseFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₦45,000, for display. Falls back to 2dp when there are stray kobo. */
export function formatKobo(kobo: number): string {
  const naira = toNaira(kobo);
  return Number.isInteger(naira)
    ? nairaFormatter.format(naira)
    : preciseFormatter.format(naira);
}

/** 45,000, bare number, used where the ₦ sign is rendered separately. */
export function formatKoboBare(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(toNaira(kobo));
}

export function percentPaid(paidKobo: number, dueKobo: number): number {
  if (dueKobo <= 0) return 100;
  return Math.min(100, Math.round((paidKobo / dueKobo) * 100));
}

/**
 * Split an amount into `count` payments, rounded up to whole naira.
 *
 * People pay in naira, not kobo, so an instalment of ₦16,666.67 reads as a
 * mistake. Rounding up means the final payment is the short one, and the
 * payment page caps it at the outstanding balance.
 */
export function perInstallmentKobo(totalKobo: number, count: number): number {
  if (count <= 1) return totalKobo;
  return Math.ceil(totalKobo / count / KOBO) * KOBO;
}

/** The most instalments a registrant may split a ticket into. */
export const MAX_INSTALLMENTS = 5;

/**
 * The smallest first payment we will accept for a given ticket.
 *
 * The camp's configured minimum is a cap, not an absolute: a flat floor set for
 * the dearest ticket would quietly make the longest plan impossible on the
 * cheaper ones. So the floor drops to whatever a full-length split needs, which
 * is how a NGN35,000 ticket can go five ways at NGN7,000 while NGN50,000 still
 * starts at NGN10,000.
 */
export function effectiveMinimumKobo(campMinimumKobo: number, totalKobo: number): number {
  if (totalKobo <= 0) return campMinimumKobo;
  return Math.min(campMinimumKobo, perInstallmentKobo(totalKobo, MAX_INSTALLMENTS));
}
