"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { FINANCE_ROLES, OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { paymentReference } from "@/lib/codes";
import { formatKobo, toKobo } from "@/lib/money";
import { assignManually, notifyRoomAssigned, unassignRoom } from "@/lib/rooms";
import { getTotals, issueTicket, sendTicketEmail, settlePayment, statusFor } from "@/lib/registration";
import { offlinePaymentSchema } from "@/lib/validation";
import type { Position } from "@/generated/prisma/enums";

export type ActionState = { ok?: string; error?: string };

function refresh(registrantId: string) {
  revalidatePath(`/admin/registrants/${registrantId}`);
  revalidatePath("/admin/registrants");
  revalidatePath("/admin");
}

/**
 * Every action here takes a bare id from form input. Without this, an id for
 * a past or otherwise out-of-scope camp would still be mutated even though
 * the page view 404s on it — this is the guard the page gets for free.
 */
async function requireRegistrantInActiveCamp(registrantId: string) {
  const camp = await requireActiveCamp();
  const registrant = await db.registrant.findUnique({ where: { id: registrantId } });
  if (!registrant || registrant.campId !== camp.id) return null;
  return registrant;
}

// ── money ────────────────────────────────────────────────────────────────────

/**
 * Bank transfers, cash at the desk and bursary waivers all land here. They run
 * through the same settlement path as a card payment, so a person who pays in
 * cash still gets their ticket emailed automatically.
 */
export async function recordOfflinePayment(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);

  const parsed = offlinePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payment details." };
  }

  const { registrantId, amountNaira, method, reference, note } = parsed.data;

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const totals = await getTotals(registrantId);
  const amountKobo = toKobo(amountNaira);

  if (amountKobo > totals.balanceKobo) {
    return { error: `That's more than the ${formatKobo(totals.balanceKobo)} outstanding.` };
  }

  const ref = reference?.trim() || paymentReference("DHM");

  const clash = await db.payment.findUnique({ where: { reference: ref } });
  if (clash) return { error: `Reference ${ref} has already been recorded.` };

  await db.payment.create({
    data: {
      registrantId,
      reference: ref,
      amountKobo,
      method,
      status: "PENDING",
      note: note || null,
      recordedById: admin.adminId,
    },
  });

  await settlePayment({ reference: ref, paidAt: new Date(), channel: method.toLowerCase() });

  await audit({
    actor: admin,
    action: "payment.recorded",
    entity: "Registrant",
    entityId: registrantId,
    meta: { amountKobo, method, reference: ref },
  });

  refresh(registrantId);
  return { ok: `₦${amountNaira.toLocaleString("en-NG")} recorded against this account.` };
}

export async function reversePayment(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);
  const camp = await requireActiveCamp();

  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { registrant: true },
  });
  if (!payment || payment.registrant.campId !== camp.id) {
    return { error: "Payment not found." };
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "REVERSED",
      note: [payment.note, `Reversed by ${admin.name}.`].filter(Boolean).join(" "),
    },
  });

  const totals = await getTotals(payment.registrantId);
  await db.registrant.update({
    where: { id: payment.registrantId },
    data: { status: statusFor(totals, payment.registrant.status) },
  });

  await audit({
    actor: admin,
    action: "payment.reversed",
    entity: "Payment",
    entityId: paymentId,
    meta: { amountKobo: payment.amountKobo },
  });

  refresh(payment.registrantId);
  return { ok: "Payment reversed. The balance has been recalculated." };
}

/** Clears whatever is left as a bursary, the person is treated as paid. */
export async function waiveBalance(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);

  const registrantId = String(formData.get("registrantId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const totals = await getTotals(registrantId);
  if (totals.balanceKobo <= 0) return { error: "There's nothing outstanding to waive." };

  const ref = paymentReference("DHW");

  await db.payment.create({
    data: {
      registrantId,
      reference: ref,
      amountKobo: totals.balanceKobo,
      method: "WAIVER",
      status: "PENDING",
      note: note || `Bursary approved by ${admin.name}.`,
      recordedById: admin.adminId,
    },
  });

  await settlePayment({ reference: ref, paidAt: new Date(), channel: "waiver" });

  await audit({
    actor: admin,
    action: "payment.waived",
    entity: "Registrant",
    entityId: registrantId,
    meta: { amountKobo: totals.balanceKobo, note },
  });

  refresh(registrantId);
  return { ok: "Balance waived. The ticket has been issued and emailed." };
}

// ── rooms ────────────────────────────────────────────────────────────────────

export async function assignRoom(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);

  const registrantId = String(formData.get("registrantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const bedLabel = String(formData.get("bedLabel") ?? "").trim();
  const notify = formData.get("notify") === "on";

  if (!roomId) return { error: "Pick a room." };

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const result = await assignManually({
    registrantId,
    roomId,
    bedLabel: bedLabel || null,
    adminId: admin.adminId,
    notify,
  });

  if (!result.ok) return { error: result.error };

  await audit({
    actor: admin,
    action: "room.assigned",
    entity: "Registrant",
    entityId: registrantId,
    meta: { roomId, bedLabel },
  });

  refresh(registrantId);
  revalidatePath("/admin/rooms");
  return { ok: notify ? "Room assigned and the registrant emailed." : "Room assigned." };
}

export async function removeFromRoom(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  await unassignRoom(registrantId);
  await audit({ actor: admin, action: "room.unassigned", entity: "Registrant", entityId: registrantId });

  refresh(registrantId);
  revalidatePath("/admin/rooms");
  return { ok: "Removed from the room." };
}

export async function resendRoomEmail(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  await notifyRoomAssigned(registrantId);
  refresh(registrantId);
  return { ok: "Room details emailed." };
}

// ── tickets ──────────────────────────────────────────────────────────────────

export async function issueTicketNow(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };
  if (registrant.status === "CANCELLED") {
    return { error: "This registration was cancelled. Reinstate it first if that's not right." };
  }

  const totals = await getTotals(registrantId);
  if (!totals.isSettled) {
    return { error: "Tickets are only issued once the balance is clear. Waive it first if that's the intention." };
  }

  await issueTicket(registrantId);
  await sendTicketEmail(registrantId);
  await audit({ actor: admin, action: "ticket.issued", entity: "Registrant", entityId: registrantId });

  refresh(registrantId);
  return { ok: "Ticket issued and emailed." };
}

export async function resendTicket(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const ticket = await db.ticket.findUnique({ where: { registrantId } });
  if (!ticket) return { error: "There's no ticket to resend." };

  await sendTicketEmail(registrantId);
  await audit({ actor: admin, action: "ticket.resent", entity: "Ticket", entityId: ticket.id });

  refresh(registrantId);
  return { ok: "Ticket emailed again." };
}

export async function revokeTicket(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const ticket = await db.ticket.findUnique({ where: { registrantId } });
  if (!ticket) return { error: "There's no ticket to revoke." };

  await db.ticket.update({
    where: { id: ticket.id },
    data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason || null },
  });

  await audit({
    actor: admin,
    action: "ticket.revoked",
    entity: "Ticket",
    entityId: ticket.id,
    meta: { reason },
  });

  refresh(registrantId);
  return { ok: "Ticket revoked. It will not scan at the gate." };
}

export async function reinstateTicket(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };
  if (registrant.status === "CANCELLED") {
    return { error: "This registration was cancelled. Reinstate the registration first." };
  }

  const ticket = await db.ticket.findUnique({ where: { registrantId } });
  if (!ticket) return { error: "There's no ticket to reinstate." };

  await db.ticket.update({
    where: { id: ticket.id },
    data: { status: "VALID", revokedAt: null, revokedReason: null },
  });

  await audit({ actor: admin, action: "ticket.reinstated", entity: "Ticket", entityId: ticket.id });

  refresh(registrantId);
  return { ok: "Ticket is valid again." };
}

// ── the record itself ────────────────────────────────────────────────────────

export async function updateRegistrant(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const position = String(formData.get("position") ?? "") as Position;
  const department = String(formData.get("department") ?? "").trim();
  const branch = String(formData.get("branch") ?? "").trim();
  const wantsPersonalAccommodation = formData.get("wantsPersonalAccommodation") === "on";
  const transportNeeded = formData.get("transportNeeded") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  await db.registrant.update({
    where: { id: registrantId },
    data: {
      position,
      department: department || null,
      branch: branch || null,
      wantsPersonalAccommodation,
      transportNeeded,
      notes: notes || null,
    },
  });

  await audit({
    actor: admin,
    action: "registrant.updated",
    entity: "Registrant",
    entityId: registrantId,
    meta: { position, department, wantsPersonalAccommodation },
  });

  refresh(registrantId);
  return { ok: "Record updated." };
}

/** Repricing after a category correction, e.g. a student registered as an adult. */
export async function changeTicketTier(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(FINANCE_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");
  const priceTierId = String(formData.get("priceTierId") ?? "");

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  const tier = await db.priceTier.findUnique({ where: { id: priceTierId } });
  if (!tier || tier.campId !== registrant.campId) {
    return { error: "That ticket type doesn't exist." };
  }

  await db.registrant.update({
    where: { id: registrantId },
    data: { priceTierId: tier.id, category: tier.category, amountDueKobo: tier.amountKobo },
  });

  const totals = await getTotals(registrantId);
  await db.registrant.update({
    where: { id: registrantId },
    data: { status: statusFor(totals, registrant.status) },
  });

  await audit({
    actor: admin,
    action: "registrant.repriced",
    entity: "Registrant",
    entityId: registrantId,
    meta: { tier: tier.label, amountKobo: tier.amountKobo },
  });

  refresh(registrantId);
  return {
    ok: `Moved to the ${tier.label} ticket. The balance has been recalculated, issue the ticket if it's now clear.`,
  };
}

export async function setRegistrationStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const registrantId = String(formData.get("registrantId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["CANCELLED", "WAITLISTED", "PENDING"].includes(status)) {
    return { error: "That status isn't allowed here." };
  }

  const registrant = await requireRegistrantInActiveCamp(registrantId);
  if (!registrant) return { error: "Registrant not found." };

  if (status === "CANCELLED") {
    await db.roomAssignment.deleteMany({ where: { registrantId } });
    await db.ticket.updateMany({
      where: { registrantId },
      data: { status: "REVOKED", revokedAt: new Date(), revokedReason: "Registration cancelled" },
    });
  }

  if (status === "PENDING") {
    // This branch is the deliberate "recalculate from payments" override, so
    // it must not inherit statusFor's CANCELLED/WAITLISTED guard — passing a
    // neutral "current" here is what lets it actually move off either one.
    const totals = await getTotals(registrantId);
    await db.registrant.update({
      where: { id: registrantId },
      data: { status: statusFor(totals, "PENDING") },
    });
  } else {
    await db.registrant.update({ where: { id: registrantId }, data: { status: status as never } });
  }

  await audit({
    actor: admin,
    action: "registrant.status-changed",
    entity: "Registrant",
    entityId: registrantId,
    meta: { status },
  });

  refresh(registrantId);
  revalidatePath("/admin/rooms");
  return {
    ok:
      status === "CANCELLED"
        ? "Registration cancelled. Room released and ticket revoked."
        : "Status updated.",
  };
}
