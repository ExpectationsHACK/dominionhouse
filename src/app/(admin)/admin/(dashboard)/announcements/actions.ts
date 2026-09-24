"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { appUrl, requireActiveCamp } from "@/lib/camp";
import { sendEmail } from "@/lib/email/send";
import { announcementEmail } from "@/lib/email/templates";
import { announcementSchema } from "@/lib/validation";

export type AnnouncementState = { ok?: string; error?: string };

function refresh() {
  revalidatePath("/admin/announcements");
  revalidatePath("/portal");
}

export async function createAnnouncement(
  _previous: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the announcement." };
  }

  const { title, body, isPinned, emailEveryone } = parsed.data;

  const announcement = await db.announcement.create({
    data: {
      campId: camp.id,
      title,
      body,
      isPinned: Boolean(isPinned),
      publishedAt: new Date(),
    },
  });

  let emailed = 0;

  if (emailEveryone) {
    // Only people with a live registration, no point emailing cancellations.
    const recipients = await db.registrant.findMany({
      where: { campId: camp.id, status: { notIn: ["CANCELLED"] } },
      select: { id: true, email: true },
    });

    const { subject, html } = announcementEmail({
      title,
      body,
      portalUrl: appUrl("/portal"),
    });

    // sendEmail never rejects (failures are logged and returned as {ok:
    // false}), so a plain Promise.all is enough to run every send in
    // parallel; count successes from the resolved value, not the promise state.
    const results = await Promise.all(
      recipients.map((recipient) =>
        sendEmail({
          to: recipient.email,
          subject,
          html,
          template: "announcement",
          registrantId: recipient.id,
        }),
      ),
    );
    emailed = results.filter((result) => result.ok).length;

    await db.announcement.update({
      where: { id: announcement.id },
      data: { emailedAt: new Date() },
    });
  }

  await audit({
    actor: admin,
    action: "announcement.published",
    entity: "Announcement",
    entityId: announcement.id,
    meta: { title, emailed },
  });

  refresh();
  return {
    ok: emailEveryone
      ? `Published and emailed to ${emailed} registrant${emailed === 1 ? "" : "s"}.`
      : "Published to the camp profiles.",
  };
}

export async function deleteAnnouncement(
  _previous: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const admin = await requireAdmin(OPS_ROLES);
  const id = String(formData.get("id") ?? "");

  const announcement = await db.announcement.findUnique({ where: { id } });
  if (!announcement) return { error: "That announcement no longer exists." };

  await db.announcement.delete({ where: { id } });
  await audit({ actor: admin, action: "announcement.deleted", entity: "Announcement", entityId: id });

  refresh();
  return { ok: "Announcement removed." };
}

export async function togglePin(
  _previous: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  await requireAdmin(OPS_ROLES);
  const id = String(formData.get("id") ?? "");

  const announcement = await db.announcement.findUnique({ where: { id } });
  if (!announcement) return { error: "That announcement no longer exists." };

  await db.announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
  });

  refresh();
  return { ok: announcement.isPinned ? "Unpinned." : "Pinned to the top." };
}
