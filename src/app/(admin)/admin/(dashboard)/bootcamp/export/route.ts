import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { lagosDay } from "@/lib/bootcamp";
import { dateTimeLabel } from "@/lib/dates";
import { sgbWhere } from "../query";

export const dynamic = "force-dynamic";

const COLUMNS = ["First name", "Last name", "WhatsApp", "Email", "Gender", "Age", "Location", "Country", "Registered on"];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Neutralise spreadsheet formula injection from free-text fields (a +234…
  // number is kept readable by the leading apostrophe too).
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** The Bootcamp sign-ups as CSV, with the page's filters (?only=emails for just the addresses). */
export async function GET(request: Request) {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  const where = sgbWhere({
    q: params.get("q") ?? undefined,
    location: params.get("location") ?? undefined,
    gender: params.get("gender") ?? undefined,
    email: params.get("email") ?? undefined,
  });
  const rows = await db.sgbRegistration.findMany({ where, orderBy: { createdAt: "asc" } });
  const stamp = lagosDay(new Date());

  if (params.get("only") === "emails") {
    // One line per address, the first person who gave it.
    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      if (!row.email || seen.has(row.email)) return false;
      seen.add(row.email);
      return true;
    });
    const body = [
      "First name,Last name,Email",
      ...unique.map((row) => [row.firstName, row.lastName, row.email].map(csvCell).join(",")),
    ].join("\r\n");
    return new Response(`﻿${body}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bootcamp-emails-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const lines = [
    COLUMNS.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.firstName,
        row.lastName,
        row.phone,
        row.email,
        row.gender,
        row.age,
        row.location,
        row.country,
        dateTimeLabel.format(row.createdAt),
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bootcamp-registrations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
