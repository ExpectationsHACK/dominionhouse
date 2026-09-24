"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { GATE_ROLES, requireAdmin } from "@/lib/auth";
import { formatKobo } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { totalsFor } from "@/lib/registration";

export type ScanResult = {
  outcome?: "admitted" | "already" | "revoked" | "unpaid" | "unknown";
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
 * One scan, one entry. Accepts either the QR payload or the printed ticket
 * code, because at the gate at night people will type what they can read.
 */
export async function scanTicket(_previous: ScanResult, formData: FormData): Promise<ScanResult> {
  const admin = await requireAdmin(GATE_ROLES);

  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return { outcome: "unknown", message: "Nothing scanned." };

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

  const updated = await db.ticket.update({
    where: { id: ticket.id },
    data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInById: admin.adminId },
  });

  await audit({
    actor: admin,
    action: "ticket.checked-in",
    entity: "Ticket",
    entityId: ticket.id,
    meta: { registrantId: registrant.id },
  });

  revalidatePath("/admin/check-in");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");

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
