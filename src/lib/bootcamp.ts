import "server-only";
import { db } from "@/lib/db";

/**
 * The Spiritual Growth Bootcamp: one place for its dates and venue (the public
 * page and the Admin desk both read them) and the numbers behind its admin page.
 */
export const BOOTCAMP = {
  name: "Spiritual Growth Bootcamp",
  /** 29 November 2026, Lagos time. */
  startsAt: new Date("2026-11-29T00:00:00+01:00"),
  /** 6 December 2026, to the end of the day, Lagos time. */
  endsAt: new Date("2026-12-06T23:59:59+01:00"),
  dateLabel: "29 Nov – 6 Dec 2026",
  venue: "Online (YouTube and WhatsApp)",
  path: "/spiritual-growth-bootcamp",
};

export function bootcampPhase(now = new Date()): "upcoming" | "running" | "ended" {
  if (now < BOOTCAMP.startsAt) return "upcoming";
  if (now <= BOOTCAMP.endsAt) return "running";
  return "ended";
}

const LAGOS_DAY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Africa/Lagos",
});

/** YYYY-MM-DD in Lagos time. */
export const lagosDay = (date: Date) => LAGOS_DAY.format(date);

function tally<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Age bands for older sign-ups that gave an age (the form no longer asks). */
function ageBand(age: number) {
  if (age < 18) return "Under 18";
  if (age < 25) return "18–24";
  if (age < 35) return "25–34";
  if (age < 50) return "35–49";
  return "50+";
}

/**
 * Everything the Bootcamp admin page charts, from one read of the table (it
 * stays small: a few hundred sign-ups for a one-week programme).
 */
export async function bootcampStats() {
  const rows = await db.sgbRegistration.findMany({
    select: { gender: true, age: true, location: true, country: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();
  const today = lagosDay(new Date());
  const weekAgo = now - 7 * 86_400_000;

  // Sign-ups per day, from the first sign-up (or 14 days back) to today.
  const perDay = new Map<string, number>();
  for (const row of rows) {
    const day = lagosDay(row.createdAt);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const firstDay = rows[0]?.createdAt.getTime() ?? now;
  const start = Math.min(firstDay, now - 13 * 86_400_000);
  const daily: { day: string; count: number }[] = [];
  for (let t = start; lagosDay(new Date(t)) <= today; t += 86_400_000) {
    const day = lagosDay(new Date(t));
    if (daily.at(-1)?.day !== day) daily.push({ day, count: perDay.get(day) ?? 0 });
  }

  // "Others: Abuja" groups under Others; the exact place is in the table.
  const location = (value: string) => (value.startsWith("Others") ? "Others" : value);

  return {
    total: rows.length,
    today: perDay.get(today) ?? 0,
    lastSevenDays: rows.filter((row) => row.createdAt.getTime() >= weekAgo).length,
    withEmail: rows.filter((row) => row.email).length,
    gender: tally(rows, (row) => row.gender),
    locations: tally(rows, (row) => location(row.location)),
    countries: tally(rows, (row) => row.country ?? "Not given"),
    ages: tally(
      rows.filter((row) => row.age !== null),
      (row) => ageBand(row.age!),
    ),
    daily: daily.slice(-30),
    latest: rows.at(-1)?.createdAt ?? null,
  };
}

/** The moment `days` days ago (for "last 7 days" counts). */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}
