import "server-only";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/camp";
import { sendEmail } from "@/lib/email/send";
import { roomAssignedEmail } from "@/lib/email/templates";
import { POSITION_LABEL, POSITION_RANK } from "@/lib/positions";

/**
 * Room sharing, assigned entirely by hand from /admin/rooms or a registrant's
 * page. There is no automatic allocator: every bed is a deliberate choice by
 * the camp desk, `assignManually` below is the one place it happens.
 *
 * Rules enforced on every manual assignment (a room is rejected outright if
 * any fails):
 *   1. Room is active and has a free bed.
 *   2. Gender matches, unless the room is explicitly MIXED.
 *   3. The registrant meets the room's minimum position, if one is set.
 *   4. The registrant is actually eligible for a room right now (paid per the
 *      camp's policy, not cancelled).
 *   5. The room and the registrant belong to the same camp.
 */

function nextBedLabel(room: { capacity: number; assignments: { bedLabel: string | null }[] }) {
  const taken = new Set(room.assignments.map((a) => a.bedLabel).filter(Boolean));
  for (let bed = 1; bed <= room.capacity; bed += 1) {
    const label = String(bed);
    if (!taken.has(label)) return label;
  }
  return String(room.assignments.length + 1);
}

/**
 * Everyone who pays gets a bed, accommodation is not opt-in. The only gates
 * are that the camp offers rooms at all, and that the fee is settled.
 */
export function isEligibleForRoom(
  registrant: { status: string },
  camp: { accommodationEnabled: boolean; requireFullPayForRoom: boolean },
) {
  if (!camp.accommodationEnabled) return false;
  if (camp.requireFullPayForRoom && registrant.status !== "PAID") return false;
  return registrant.status !== "CANCELLED";
}

export async function assignManually(args: {
  registrantId: string;
  roomId: string;
  bedLabel?: string | null;
  adminId?: string | null;
  notify?: boolean;
}) {
  const result = await db.$transaction(async (tx) => {
    // Lock the target room row so two concurrent assignments to it serialize
    // instead of both reading the same "occupied" snapshot and both fitting.
    await tx.$executeRaw`SELECT id FROM "Room" WHERE id = ${args.roomId} FOR UPDATE`;

    const [room, registrant] = await Promise.all([
      tx.room.findUnique({
        where: { id: args.roomId },
        include: { assignments: { select: { bedLabel: true } } },
      }),
      tx.registrant.findUnique({
        where: { id: args.registrantId },
        include: { roomAssignment: true, camp: true },
      }),
    ]);

    if (!room) return { ok: false as const, error: "That room no longer exists." };
    if (!registrant) return { ok: false as const, error: "That registrant no longer exists." };
    if (room.campId !== registrant.campId) {
      return { ok: false as const, error: "That room belongs to a different camp." };
    }
    if (!isEligibleForRoom(registrant, registrant.camp)) {
      return {
        ok: false as const,
        error: `${registrant.firstName} ${registrant.lastName} isn't eligible for a room right now (cancelled, or not paid per policy).`,
      };
    }
    if (room.minPosition) {
      const rank = POSITION_RANK[registrant.position];
      if (rank < POSITION_RANK[room.minPosition]) {
        return {
          ok: false as const,
          error: `${room.block} ${room.name} is reserved for ${POSITION_LABEL[room.minPosition]} and above.`,
        };
      }
    }

    const occupied = room.assignments.length;
    const movingWithinSameRoom = registrant.roomAssignment?.roomId === room.id;
    if (!movingWithinSameRoom && occupied >= room.capacity) {
      return { ok: false as const, error: `${room.block} ${room.name} is full (${room.capacity} beds).` };
    }
    if (room.gender !== "MIXED" && room.gender !== registrant.gender) {
      return { ok: false as const, error: `${room.block} ${room.name} is a ${room.gender.toLowerCase()} room.` };
    }

    const bedLabel = args.bedLabel?.trim() || nextBedLabel(room);

    await tx.roomAssignment.upsert({
      where: { registrantId: args.registrantId },
      create: {
        registrantId: args.registrantId,
        roomId: args.roomId,
        bedLabel,
        method: "MANUAL",
        assignedById: args.adminId ?? null,
      },
      update: {
        roomId: args.roomId,
        bedLabel,
        method: "MANUAL",
        assignedById: args.adminId ?? null,
        assignedAt: new Date(),
      },
    });

    return { ok: true as const };
  });

  if (result.ok && args.notify) await notifyRoomAssigned(args.registrantId);

  return result;
}

export async function unassignRoom(registrantId: string) {
  await db.roomAssignment.deleteMany({ where: { registrantId } });
  return { ok: true as const };
}

export async function notifyRoomAssigned(registrantId: string) {
  const assignment = await db.roomAssignment.findUnique({
    where: { registrantId },
    include: {
      room: { include: { assignments: { include: { registrant: true } } } },
      registrant: true,
    },
  });
  if (!assignment) return;

  const roommates = assignment.room.assignments
    .filter((a) => a.registrantId !== registrantId)
    .map((a) => `${a.registrant.firstName} ${a.registrant.lastName}`);

  const { subject, html } = roomAssignedEmail({
    firstName: assignment.registrant.firstName,
    block: assignment.room.block,
    room: assignment.room.name,
    bedLabel: assignment.bedLabel,
    roommates,
    portalUrl: appUrl("/portal"),
  });

  await sendEmail({
    to: assignment.registrant.email,
    subject,
    html,
    template: "room-assigned",
    registrantId,
  });
}

export async function occupancySummary(campId: string) {
  const rooms = await db.room.findMany({
    where: { campId },
    include: { assignments: true },
  });

  const beds = rooms.reduce((sum, room) => sum + (room.isActive ? room.capacity : 0), 0);
  const filled = rooms.reduce((sum, room) => sum + room.assignments.length, 0);

  return { rooms: rooms.length, beds, filled, free: Math.max(0, beds - filled) };
}
