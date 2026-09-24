"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { assignManually, unassignRoom } from "@/lib/rooms";
import { roomSchema } from "@/lib/validation";
import type { Position } from "@/generated/prisma/enums";

export type RoomActionState = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/registrants");
  revalidatePath("/admin");
}

export async function createRoom(
  _previous: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const parsed = roomSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the room details." };
  }

  const { block, name, capacity, gender, type, floor, notes, minPosition } = parsed.data;

  const clash = await db.room.findUnique({
    where: { campId_block_name: { campId: camp.id, block, name } },
  });
  if (clash) return { error: `${block} ${name} already exists.` };

  await db.room.create({
    data: {
      campId: camp.id,
      block,
      name,
      capacity,
      gender,
      type,
      floor: floor || null,
      notes: notes || null,
      minPosition: (minPosition || null) as Position | null,
    },
  });

  await audit({ actor: admin, action: "room.created", entity: "Room", meta: { block, name, capacity } });

  refresh();
  return { ok: `${block} ${name} added with ${capacity} beds.` };
}

/** Bulk-create a numbered run of identical rooms, how a real block gets set up. */
export async function createRoomBlock(
  _previous: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const block = String(formData.get("block") ?? "").trim();
  const prefix = String(formData.get("prefix") ?? "").trim();
  const count = Number.parseInt(String(formData.get("count") ?? "0"), 10);
  const capacity = Number.parseInt(String(formData.get("capacity") ?? "0"), 10);
  const gender = String(formData.get("gender") ?? "MIXED");
  const type = String(formData.get("type") ?? "DORMITORY");
  const minPosition = String(formData.get("minPosition") ?? "");

  if (!block || !prefix) return { error: "Give the block a name and a room prefix." };
  if (!Number.isFinite(count) || count < 1 || count > 100) {
    return { error: "Create between 1 and 100 rooms at a time." };
  }
  if (!Number.isFinite(capacity) || capacity < 1) return { error: "Set a bed count." };

  const rows = Array.from({ length: count }, (_, index) => ({
    campId: camp.id,
    block,
    name: `${prefix}${String(index + 1).padStart(2, "0")}`,
    capacity,
    gender: gender as never,
    type: type as never,
    minPosition: (minPosition || null) as Position | null,
  }));

  // One round trip either way; the unique (campId, block, name) index quietly
  // skips any name that's already taken instead of a per-row existence check.
  const { count: created } = await db.room.createMany({ data: rows, skipDuplicates: true });

  await audit({
    actor: admin,
    action: "room.block-created",
    entity: "Room",
    meta: { block, count: created, capacity },
  });

  refresh();
  return {
    ok: `${created} room${created === 1 ? "" : "s"} added to ${block} (${created * capacity} beds).`,
  };
}

export async function updateRoom(
  _previous: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();
  const roomId = String(formData.get("roomId") ?? "");

  const capacity = Number.parseInt(String(formData.get("capacity") ?? "0"), 10);
  const isActive = formData.get("isActive") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { _count: { select: { assignments: true } } },
  });
  if (!room || room.campId !== camp.id) return { error: "Room not found." };

  if (Number.isFinite(capacity) && capacity < room._count.assignments) {
    return {
      error: `${room._count.assignments} people are already in this room, capacity can't drop below that.`,
    };
  }

  await db.room.update({
    where: { id: roomId },
    data: {
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : room.capacity,
      isActive,
      notes: notes || null,
    },
  });

  await audit({ actor: admin, action: "room.updated", entity: "Room", entityId: roomId });

  refresh();
  return { ok: `${room.block} ${room.name} updated.` };
}

export async function deleteRoom(
  _previous: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();
  const roomId = String(formData.get("roomId") ?? "");

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { _count: { select: { assignments: true } } },
  });
  if (!room || room.campId !== camp.id) return { error: "Room not found." };
  if (room._count.assignments > 0) {
    return { error: "Move everyone out before deleting this room." };
  }

  await db.room.delete({ where: { id: roomId } });
  await audit({ actor: admin, action: "room.deleted", entity: "Room", entityId: roomId });

  refresh();
  return { ok: `${room.block} ${room.name} deleted.` };
}

export async function moveOccupant(
  _previous: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const registrantId = String(formData.get("registrantId") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const notify = formData.get("notify") === "on";

  const registrant = await db.registrant.findUnique({ where: { id: registrantId } });
  if (!registrant || registrant.campId !== camp.id) {
    return { error: "Registrant not found." };
  }

  if (!roomId) {
    await unassignRoom(registrantId);
    refresh();
    return { ok: "Removed from the room." };
  }

  const result = await assignManually({ registrantId, roomId, adminId: admin.adminId, notify });
  if (!result.ok) return { error: result.error };

  await audit({
    actor: admin,
    action: "room.moved",
    entity: "Registrant",
    entityId: registrantId,
    meta: { roomId },
  });

  refresh();
  return { ok: "Moved." };
}
