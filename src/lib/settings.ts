import "server-only";
import { db } from "@/lib/db";

/**
 * Small key/value store for site-wide values that aren't worth a column.
 * Values are kept as JSON so a setting can grow beyond a string later.
 */
export const SETTING_KEYS = {
  /** Where "Listen to the messages" sends people, e.g. a YouTube channel. */
  messagesUrl: "messagesUrl",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return null;
  return typeof row.value === "string" ? row.value : null;
}

export async function setSetting(key: string, value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    await db.setting.deleteMany({ where: { key } });
    return;
  }

  await db.setting.upsert({
    where: { key },
    create: { key, value: trimmed },
    update: { value: trimmed },
  });
}
