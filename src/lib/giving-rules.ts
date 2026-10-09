/**
 * The Angel Partners covenant in numbers, and the small pure helpers around
 * it. No database or network here, so it's shared by the form, the server and
 * the tests.
 */

export const GIVING_CURRENCIES = ["NGN", "USD"] as const;
export type GivingCurrency = (typeof GIVING_CURRENCIES)[number];

/** The 20/20/20 covenant: at least ₦20,000 or $20 a month. */
export const MONTHLY_MINIMUM_MAJOR: Record<GivingCurrency, number> = { NGN: 20_000, USD: 20 };
/** A one-time seed can be any size from this. */
export const ONE_TIME_MINIMUM_MAJOR: Record<GivingCurrency, number> = { NGN: 1_000, USD: 5 };
/** Quick-pick monthly amounts on the form. */
export const MONTHLY_PRESETS_MAJOR: Record<GivingCurrency, number[]> = {
  NGN: [20_000, 50_000, 100_000, 250_000],
  USD: [20, 50, 100, 250],
};

const SYMBOL: Record<GivingCurrency, string> = { NGN: "₦", USD: "$" };

export function isGivingCurrency(value: unknown): value is GivingCurrency {
  return typeof value === "string" && (GIVING_CURRENCIES as readonly string[]).includes(value);
}

/** Both currencies have 100 minor units (kobo, cents). */
export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

/** ₦20,000 or $20 (whole amounts), with decimals only when there are some. */
export function formatMoney(minor: number, currency: string): string {
  const symbol = isGivingCurrency(currency) ? SYMBOL[currency] : `${currency} `;
  const major = toMajor(minor);
  return `${symbol}${major.toLocaleString("en-NG", {
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Why an amount can't be accepted, or null when it can. */
export function amountProblem(
  major: number,
  currency: GivingCurrency,
  kind: "MONTHLY" | "ONE_TIME",
): string | null {
  if (!Number.isFinite(major) || major <= 0) return "Enter an amount.";
  const minimum = kind === "MONTHLY" ? MONTHLY_MINIMUM_MAJOR[currency] : ONE_TIME_MINIMUM_MAJOR[currency];
  if (major < minimum) {
    return kind === "MONTHLY"
      ? `The Angel Partner covenant starts at ${formatMoney(toMinor(minimum), currency)} a month.`
      : `The smallest seed we can take online is ${formatMoney(toMinor(minimum), currency)}.`;
  }
  if (major > (currency === "NGN" ? 50_000_000 : 50_000)) {
    return "For a gift this size, please talk to the partnership team so we can receive it properly.";
  }
  if (Math.round(major * 100) !== major * 100) return "Use at most two decimal places.";
  return null;
}

/** A reference that marks a payment as giving, not a camp fee: DHG-…. */
export const GIFT_REFERENCE_PREFIX = "DHG";

export function isGiftReference(reference: string): boolean {
  return reference.startsWith(`${GIFT_REFERENCE_PREFIX}-`);
}
