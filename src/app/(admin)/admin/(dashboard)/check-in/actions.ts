"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { GATE_ROLES, requireAdmin } from "@/lib/auth";
import { isWithinCampDays, requireActiveCamp } from "@/lib/camp";
import { formatKobo } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { totalsFor } from "@/lib/registration";
import type { AdminSession } from "@/lib/session";

export type ScanResult = {
  outcome?: "admitted" | "already" | "revoked" | "unpaid" | "unknown" | "early";
  message?: string;
  person?: {
    id: string;
    name: string;
    ticketCode: string;
    category: string;
    room: string | null;
    checkedInAt: string | null;
    medicalNotes: string | null;
  };
};

/**
 * The one place a ticket is actually admitted. Shared by the gate scanner and
 * the public ticket page (an admin visiting it in camp days auto-admits the
 * same way), so both stay in lockstep with the same rules and audit trail.
 */
async function admit(ticketId: string, admin: AdminSession) {
  const updated = await db.ticket.update({
    where: { id: ticketId },
    data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInById: admin.adminId },
  });

  await audit({
    actor: admin,
    action: "ticket.checked-in",
    entity: "Ticket",
    entityId: ticketId,
    meta: { registrantId: updated.registrantId },
  });

  revalidatePath("/admin/check-in");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");

  return updated;
}

/**
 * One scan, one entry. Accepts either the QR payload or the printed ticket
 * code, because at the gate at night people will type what they can read.
 */
export async function scanTicket(_previous: ScanResult, formData: FormData): Promise<ScanResult> {
  const admin = await requireAdmin(GATE_ROLES);

  const scanned = String(formData.get("code") ?? "").trim();
  if (!scanned) return { outcome: "unknown", message: "Nothing scanned." };

  // The QR now encodes a full ticket-page URL; a camera scan yields that, a
  // USB scanner or typed entry yields the bare token or printed ticket code.
  const raw = scanned.includes("/t/") ? (scanned.split("/t/")[1]?.split(/[?#]/)[0] ?? scanned) : scanned;
  const value = raw.toUpperCase();

  const ticket = await db.ticket.findFirst({
    where: { OR: [{ qrPayload: raw }, { qrPayload: value }, { code: value }] },
    include: {
      registrant: {
        include: {
          payments: { select: { amountKobo: true, status: true } },
          roomAssignment: { include: { room: true } },
        },
      },
    },
  });

  if (!ticket) {
    return { outcome: "unknown", message: `No ticket matches "${raw}".` };
  }

  const registrant = ticket.registrant;
  const person = {
    id: registrant.id,
    name: `${registrant.firstName} ${registrant.lastName}`,
    ticketCode: ticket.code,
    category: CATEGORY_LABEL[registrant.category],
    room: registrant.roomAssignment
      ? `${registrant.roomAssignment.room.block} ${registrant.roomAssignment.room.name}${
          registrant.roomAssignment.bedLabel ? ` · Bed ${registrant.roomAssignment.bedLabel}` : ""
        }`
      : null,
    checkedInAt: ticket.checkedInAt?.toISOString() ?? null,
    medicalNotes: registrant.medicalNotes,
  };

  if (ticket.status === "REVOKED") {
    return {
      outcome: "revoked",
      message: ticket.revokedReason ?? "This ticket has been revoked.",
      person,
    };
  }

  if (ticket.status === "CHECKED_IN") {
    return { outcome: "already", message: "Already checked in.", person };
  }

  const totals = totalsFor(registrant);
  if (!totals.isSettled) {
    return {
      outcome: "unpaid",
      message: `${formatKobo(totals.balanceKobo)} still outstanding, send them to the finance desk.`,
      person,
    };
  }

  const camp = await requireActiveCamp();
  if (!isWithinCampDays(camp)) {
    return {
      outcome: "early",
      message: "Camp hasn't started yet. Here's who they are, not checked in.",
      person,
    };
  }

  const updated = await admit(ticket.id, admin);

  return {
    outcome: "admitted",
    message: "Admitted.",
    person: { ...person, checkedInAt: updated.checkedInAt?.toISOString() ?? null },
  };
}

export async function undoCheckIn(
  _previous: { ok?: string; error?: string },
  formData: FormData,
) {
  const admin = await requireAdmin(GATE_ROLES);
  const ticketId = String(formData.get("ticketId") ?? "");

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found." };

  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "VALID", checkedInAt: null, checkedInById: null },
  });

  await audit({ actor: admin, action: "ticket.check-in-undone", entity: "Ticket", entityId: ticketId });

  revalidatePath("/admin/check-in");
  revalidatePath("/admin/tickets");
  return { ok: "Check-in undone." };
}

/**
 * Called from the public ticket page, not a form, a gate scan there is
 * pointing a phone camera at the printed QR and expecting the same one-tap
 * result the dashboard scanner gives, no separate "confirm" step.
 *
 * Re-checks every rule itself rather than trusting what the page already
 * rendered, so a ticket that changed status in the seconds between the page
 * loading and this firing (paid, revoked, already admitted elsewhere) is
 * never double-processed.
 */
export async function admitFromTicketLink(
  ticketId: string,
): Promise<{ ok: boolean; message: string; checkedInAt: string | null }> {
  const admin = await requireAdmin(GATE_ROLES);

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { registrant: { include: { payments: { select: { amountKobo: true, status: true } } } } },
  });
  if (!ticket) return { ok: false, message: "Ticket not found.", checkedInAt: null };
  if (ticket.status === "REVOKED") {
    return { ok: false, message: "This ticket has been revoked.", checkedInAt: null };
  }
  if (ticket.status === "CHECKED_IN") {
    return { ok: true, message: "Already checked in.", checkedInAt: ticket.checkedInAt?.toISOString() ?? null };
  }
  if (!totalsFor(ticket.registrant).isSettled) {
    return { ok: false, message: "There's a balance outstanding.", checkedInAt: null };
  }

  const camp = await requireActiveCamp();
  if (!isWithinCampDays(camp)) {
    return { ok: false, message: "Camp hasn't started yet.", checkedInAt: null };
  }

  const updated = await admit(ticket.id, admin);
  return { ok: true, message: "Admitted.", checkedInAt: updated.checkedInAt?.toISOString() ?? null };
}
