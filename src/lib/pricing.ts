import type { AgeCategory } from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<AgeCategory, string> = {
  ADULT: "Adult",
  STUDENT: "Campus Student",
  TEEN: "Teenager",
  CHILD: "Child",
};

/** A child registering on their own child ticket is free under this age. */
export const CHILD_FREE_UNDER_AGE = 5;

/**
 * The one place a registrant's real camp fee is worked out, so the form's
 * live preview and the server's actual charge can never drift apart.
 *
 * - A Guest (Lighthouse or Ministry "Guest") pays nothing, for every category
 *   except Child, who is priced by age instead.
 * - A Child ticket is free under 5, otherwise the tier's price.
 * - An Adult bringing children pays the Child tier's rate for each one aged
 *   5–11; under-5s are free and aren't charged for.
 */
export function amountDueKobo(args: {
  category: AgeCategory;
  tierAmountKobo: number;
  lighthouse?: string | null;
  childAgeYears?: number | null;
  bringingChildren?: boolean;
  children5to11?: number;
  childFeeKobo: number;
}): number {
  const isGuest = args.lighthouse === "Guest";

  if (args.category === "CHILD") {
    const age = args.childAgeYears ?? null;
    return age !== null && age < CHILD_FREE_UNDER_AGE ? 0 : args.tierAmountKobo;
  }

  let amountKobo = isGuest ? 0 : args.tierAmountKobo;

  if (args.category === "ADULT" && args.bringingChildren) {
    amountKobo += Math.max(0, args.children5to11 ?? 0) * args.childFeeKobo;
  }

  return amountKobo;
}
