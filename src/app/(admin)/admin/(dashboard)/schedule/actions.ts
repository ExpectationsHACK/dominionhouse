"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { scheduleItemSchema } from "@/lib/validation";

export type ScheduleState = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/admin/schedule");
  revalidatePath("/camp");
  revalidatePath("/portal/schedule");
}

/** Camp runs on West Africa Time (UTC+1), with no daylight saving to worry about. */
function lagosInstant(day: string, time: string) {
  return new Date(`${day}T${time}:00+01:00`);
}

export async function saveScheduleItem(
  _previous: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const parsed = scheduleItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the session details." };
  }

  const { day, startTime, endTime, title, description, speaker, location, type } = parsed.data;
  const id = String(formData.get("id") ?? "");

  const startsAt = lagosInstant(day, startTime);
  const endsAt = endTime ? lagosInstant(day, endTime) : null;

  if (endsAt && endsAt <= startsAt) {
    return { error: "The end time has to be after the start time." };
  }

  const data = {
    day: new Date(`${day}T00:00:00Z`),
    startsAt,
    endsAt,
    title,
    description: description || null,
    speaker: speaker || null,
    location: location || null,
    type,
    isPublished: formData.get("isPublished") !== null ? formData.get("isPublished") === "on" : true,
  };

  if (id) {
    await db.scheduleItem.update({ where: { id }, data });
    await audit({ actor: admin, action: "schedule.updated", entity: "ScheduleItem", entityId: id });
    refresh();
    return { ok: `"${title}" updated.` };
  }

  await db.scheduleItem.create({ data: { ...data, campId: camp.id } });
  await audit({ actor: admin, action: "schedule.created", entity: "ScheduleItem", meta: { title } });

  refresh();
  return { ok: `"${title}" added to the programme.` };
}

export async function deleteScheduleItem(
  _previous: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  const admin = await requireAdmin(OPS_ROLES);
  const id = String(formData.get("id") ?? "");

  const item = await db.scheduleItem.findUnique({ where: { id } });
  if (!item) return { error: "That session no longer exists." };

  await db.scheduleItem.delete({ where: { id } });
  await audit({ actor: admin, action: "schedule.deleted", entity: "ScheduleItem", entityId: id });

  refresh();
  return { ok: `"${item.title}" removed.` };
}

export async function toggleSchedulePublish(
  _previous: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireAdmin(OPS_ROLES);
  const id = String(formData.get("id") ?? "");

  const item = await db.scheduleItem.findUnique({ where: { id } });
  if (!item) return { error: "That session no longer exists." };

  await db.scheduleItem.update({
    where: { id },
    data: { isPublished: !item.isPublished },
  });

  refresh();
  return { ok: item.isPublished ? "Hidden from registrants." : "Published." };
}
