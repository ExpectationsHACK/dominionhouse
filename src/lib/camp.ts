import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const CAMP_SLUG = "camp-meeting-2027";

/**
 * The camp's name in one place.
 *
 * Pages that load the camp should render `camp.name` so a rename in
 * /admin/settings takes effect immediately. This constant is the fallback for
 * the places that have no camp in scope, chiefly the email templates.
 */
export const CAMP_NAME = "Fresh Fire Camp Meeting 2027";

/** The distinctive half of the name, for tight spaces like the nav. */
export const CAMP_SHORT_NAME = "Fresh Fire";

/**
 * Split a camp name for the poster lockup: "Fresh Fire Camp Meeting 2027"
 * becomes { lead: "Fresh Fire Camp Meeting", year: "27" } so the year can be
 * set in brass. Falls back to the whole name when it has no trailing year.
 */
export function campLockup(name: string): { lead: string; year: string | null } {
  const match = name.match(/^(.*?)\s+((?:19|20)\d{2})$/);
  if (!match) return { lead: name, year: null };
  return { lead: match[1].trim(), year: match[2].slice(2) };
}

export function appUrl(path = "") {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The one camp currently being sold. Cached per request. */
export const getActiveCamp = cache(async () => {
  const camp = await db.camp.findFirst({
    where: { isActive: true },
    include: { priceTiers: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
  });
  return camp;
});

export const requireActiveCamp = cache(async () => {
  const camp = await getActiveCamp();
  if (!camp) {
    throw new Error(
      `No active camp found. Run \`npm run db:seed\` to create ${CAMP_NAME}.`,
    );
  }
  return camp;
});

export function registrationIsOpen(camp: {
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
}) {
  const now = new Date();
  if (camp.registrationOpensAt && now < camp.registrationOpensAt) return false;
  if (camp.registrationClosesAt && now > camp.registrationClosesAt) return false;
  return true;
}
