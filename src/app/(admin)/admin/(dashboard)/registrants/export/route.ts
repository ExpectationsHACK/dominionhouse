import { db } from "@/lib/db";
import { FINANCE_ROLES, OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { dateOnly } from "@/lib/dates";
import { toNaira } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL } from "@/lib/positions";
import {
  buildRegistrantOrder,
  buildRegistrantWhere,
  type RegistrantFilters,
} from "@/lib/registrant-query";
import { totalsFor } from "@/lib/registration";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "Registration code",
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Gender",
  "Ticket",
  "Position",
  "Department",
  "Lighthouse or Ministry",
  "Region",
  "Branch",
  "City",
  "State",
  "Status",
  "Fee (NGN)",
  "Paid (NGN)",
  "Balance (NGN)",
  "Payment plan",
  "Instalments",
  "First instalment (NGN)",
  "Ticket number",
  "Ticket status",
  "Block",
  "Room",
  "Bed",
  "Wants personal room",
  "Transport",
  "Emergency contact",
  "Emergency phone",
  "Medical notes",
  "Allergies",
  "Registered on",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Neutralise spreadsheet formula injection from free-text fields.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  // Same allow-list as the registrants list page, minus USHER: gate staff
  // scan tickets, they have no reason to hold a PII/financial export.
  await requireAdmin([...OPS_ROLES, ...FINANCE_ROLES]);

  const camp = await requireActiveCamp();
  const url = new URL(request.url);
  const filters = Object.fromEntries(url.searchParams) as RegistrantFilters;

  const registrants = await db.registrant.findMany({
    where: buildRegistrantWhere(camp.id, filters),
    orderBy: buildRegistrantOrder(filters.sort),
    include: {
      payments: { select: { amountKobo: true, status: true } },
      ticket: true,
      roomAssignment: { include: { room: true } },
    },
  });

  const lines = [COLUMNS.map(csvCell).join(",")];

  for (const registrant of registrants) {
    const totals = totalsFor(registrant);
    lines.push(
      [
        registrant.registrationCode,
        registrant.firstName,
        registrant.lastName,
        registrant.email,
        registrant.phone,
        registrant.gender,
        CATEGORY_LABEL[registrant.category],
        POSITION_LABEL[registrant.position],
        registrant.department ?? "",
        registrant.lighthouse ?? "",
        registrant.region ?? "",
        registrant.branch ?? "",
        registrant.city ?? "",
        registrant.state ?? "",
        registrant.status,
        toNaira(totals.dueKobo),
        toNaira(totals.paidKobo),
        toNaira(totals.balanceKobo),
        registrant.paymentPlan,
        registrant.installmentCount ?? "",
        registrant.firstInstallmentKobo ? toNaira(registrant.firstInstallmentKobo) : "",
        registrant.ticket?.code ?? "",
        registrant.ticket?.status ?? "",
        registrant.roomAssignment?.room.block ?? "",
        registrant.roomAssignment?.room.name ?? "",
        registrant.roomAssignment?.bedLabel ?? "",
        registrant.wantsPersonalAccommodation ? "Yes" : "No",
        registrant.transportNeeded ? "Yes" : "No",
        registrant.emergencyName,
        registrant.emergencyPhone,
        registrant.medicalNotes ?? "",
        registrant.allergies ?? "",
        dateOnly.format(registrant.createdAt),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);

  // BOM so Excel opens the Naira sign and accented names correctly.
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="camp-2027-registrants-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
