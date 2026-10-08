import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { MediaPlacement } from "@/generated/prisma/enums";

/**
 * Database reads for the public pages, shared across visitors.
 *
 * On Cloudflare every request opens its own database connection, a round
 * trip across the internet, so a homepage that queried on each visit spent
 * most of its time waiting on Postgres. These results are kept in the
 * incremental cache (KV) instead, refreshed every 30 minutes: admin edits
 * reach the public pages within half an hour, and visitors in between pay
 * nothing. Not more often: Cloudflare's free KV plan allows about 1,000 writes
 * a day, and these entries plus the cached pages they feed are rewritten on
 * each refresh.
 *
 * Only display reads belong here. Anything that prices, charges or registers
 * someone (registration, payment) reads the database directly, uncached.
 */
export const PUBLIC_TTL_SECONDS = 1800;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/** The cache stores JSON, so dates come back as strings: turn them back. */
function reviveDates<T>(value: T): T {
  if (typeof value === "string") return (ISO_DATE.test(value) ? new Date(value) : value) as T;
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, reviveDates(inner)]),
    ) as T;
  }
  return value;
}

function shared<Args extends unknown[], Result>(
  key: string,
  query: (...args: Args) => Promise<Result>,
) {
  const cached = unstable_cache(query, [key], { revalidate: PUBLIC_TTL_SECONDS });
  return async (...args: Args): Promise<Result> => reviveDates(await cached(...args));
}

/** The camp being sold, with its active price tiers, for display only. */
export const getPublicCamp = shared("public-camp", () =>
  db.camp.findFirst({
    where: { isActive: true },
    include: { priceTiers: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { startsAt: "asc" },
  }),
);

const getActiveMedia = shared("public-media", () =>
  db.siteMedia.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }),
);

/** Active media for one placement, in the admin's order. A small table: one read serves all. */
export async function getPublicMedia(placement: MediaPlacement) {
  return (await getActiveMedia()).filter((row) => row.placement === placement);
}

/** The published programme for a camp. */
export const getPublicSchedule = shared("public-schedule", (campId: string) =>
  db.scheduleItem.findMany({
    where: { campId, isPublished: true },
    orderBy: [{ startsAt: "asc" }],
  }),
);
