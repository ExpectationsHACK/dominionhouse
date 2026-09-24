"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { siteMediaSchema } from "@/lib/validation";
import { setSetting, SETTING_KEYS } from "@/lib/settings";

export type ContentState = { ok?: string; error?: string };

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

function refresh() {
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/camp");
}

export async function saveHeroMedia(
  _previous: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const admin = await requireAdmin([...CONTENT_ROLES]);

  const parsed = siteMediaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const { placement, title, subtitle, videoUrl, imageUrl, linkUrl, posterUrl, sortOrder } = parsed.data;
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "on";

  const data = {
    placement,
    title,
    subtitle: subtitle || null,
    videoUrl: videoUrl || null,
    imageUrl: imageUrl || null,
    linkUrl: linkUrl || null,
    posterUrl: posterUrl || null,
    sortOrder,
    isActive,
  };

  if (id) {
    await db.siteMedia.update({ where: { id }, data });
    await audit({ actor: admin, action: "content.hero-updated", entity: "HeroMedia", entityId: id });
    refresh();
    return { ok: `"${title}" updated.` };
  }

  await db.siteMedia.create({ data });
  await audit({ actor: admin, action: "content.hero-created", entity: "HeroMedia", meta: { title } });

  refresh();
  return { ok: `"${title}" added.` };
}

export async function deleteHeroMedia(
  _previous: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const admin = await requireAdmin([...CONTENT_ROLES]);
  const id = String(formData.get("id") ?? "");

  const media = await db.siteMedia.findUnique({ where: { id } });
  if (!media) return { error: "That card no longer exists." };

  await db.siteMedia.delete({ where: { id } });
  await audit({ actor: admin, action: "content.hero-deleted", entity: "HeroMedia", entityId: id });

  refresh();
  return { ok: `"${media.title}" removed.` };
}

export async function toggleHeroMedia(
  _previous: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await requireAdmin([...CONTENT_ROLES]);
  const id = String(formData.get("id") ?? "");

  const media = await db.siteMedia.findUnique({ where: { id } });
  if (!media) return { error: "That card no longer exists." };

  await db.siteMedia.update({ where: { id }, data: { isActive: !media.isActive } });

  refresh();
  return { ok: media.isActive ? "Hidden from the homepage." : "Showing on the homepage." };
}

/** Nudge a card up or down the running order. */
export async function moveHeroMedia(
  _previous: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await requireAdmin([...CONTENT_ROLES]);

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const placement = String(formData.get("placement") ?? "HERO_GALLERY");
  const all = await db.siteMedia.findMany({
    where: { placement: placement as "HERO_GALLERY" | "CAMP_CARDS" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = all.findIndex((media) => media.id === id);
  if (index === -1) return { error: "That card no longer exists." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) return { ok: "Already at the end." };

  // Rewrite the whole order so positions stay contiguous even if they drifted.
  const reordered = [...all];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  for (const [position, media] of reordered.entries()) {
    if (media.sortOrder !== position) {
      await db.siteMedia.update({ where: { id: media.id }, data: { sortOrder: position } });
    }
  }

  refresh();
  return { ok: "Order updated." };
}

export async function saveMessagesLink(
  _previous: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const admin = await requireAdmin([...CONTENT_ROLES]);
  const url = String(formData.get("messagesUrl") ?? "").trim();

  if (url && !/^https?:\/\//i.test(url)) {
    return { error: "Enter a full link, starting with https://" };
  }

  await setSetting(SETTING_KEYS.messagesUrl, url);
  await audit({ actor: admin, action: "content.messages-link", entity: "Setting", meta: { url } });

  refresh();
  return { ok: url ? "Messages link saved." : "Messages link cleared, the button is hidden." };
}
