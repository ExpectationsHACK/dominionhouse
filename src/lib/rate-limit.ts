import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * A simple in-memory fixed-window limiter — a brute-force speed bump, not a
 * hard guarantee. It resets on restart and doesn't share state across
 * instances, which is an acceptable trade-off at this app's scale (one camp's
 * traffic, not a high-volume public API) against adding a Redis/KV dependency
 * for it. Good enough to turn an unlimited password/phone-guessing script
 * into one that has to wait.
 */
export function rateLimit(key: string, options: { max: number; windowMs: number }) {
  const now = Date.now();

  // Cheap opportunistic cleanup so this map doesn't grow forever.
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true as const };
  }

  if (existing.count >= options.max) {
    return { ok: false as const, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true as const };
}

/** Best-effort client IP from the proxy headers a real deployment sets. */
export async function requestIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return list.get("x-real-ip") ?? "unknown";
}

const TOO_MANY_ATTEMPTS = "Too many attempts. Wait a few minutes and try again.";

/**
 * Rate-limits by email and by IP together, so this can't be worked around by
 * either rotating the email (against one IP) or rotating the IP (against one
 * email). Returns an error message when either limit is hit.
 */
export async function checkLoginRateLimit(
  email: string,
  options: { max: number; windowMs: number },
): Promise<string | null> {
  const ip = await requestIp();
  const byEmail = rateLimit(`email:${email.toLowerCase()}`, options);
  const byIp = rateLimit(`ip:${ip}`, options);
  if (!byEmail.ok || !byIp.ok) return TOO_MANY_ATTEMPTS;
  return null;
}
