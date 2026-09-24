import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminRole } from "@/generated/prisma/enums";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev_secret_do_not_use_in_production_0000000000",
);

/**
 * A missing secret must never fall back silently in production: that fallback
 * is a fixed string checked into the repo's history, so any session signed
 * with it is forgeable by anyone who has read this file. Checked lazily, on
 * first real sign/verify, rather than at module load — `next build` sets
 * NODE_ENV=production for the compile step itself, so throwing at import time
 * would fail every build, not just a misconfigured live deployment.
 */
function assertSecretConfigured() {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Refusing to run in production, session cookies would be signed with a guessable key.",
    );
  }
}

export const PORTAL_COOKIE = "dh_portal";
export const ADMIN_COOKIE = "dh_admin";

export type PortalSession = { registrantId: string; email: string };
export type AdminSession = { adminId: string; email: string; name: string; role: AdminRole };

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

async function sign(payload: Record<string, unknown>, maxAgeSeconds: number) {
  assertSecretConfigured();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret);
}

async function read<T>(name: string): Promise<T | null> {
  assertSecretConfigured();
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

// ── registrant portal, 30 days, they check in from a phone ───────────────────

const PORTAL_MAX_AGE = 60 * 60 * 24 * 30;

export async function createPortalSession(session: PortalSession) {
  const token = await sign({ ...session }, PORTAL_MAX_AGE);
  (await cookies()).set(PORTAL_COOKIE, token, { ...COOKIE_BASE, maxAge: PORTAL_MAX_AGE });
}

export async function getPortalSession() {
  return read<PortalSession>(PORTAL_COOKIE);
}

export async function destroyPortalSession() {
  (await cookies()).delete(PORTAL_COOKIE);
}

// ── admin, 12 hours, a working day at the registration desk ──────────────────

const ADMIN_MAX_AGE = 60 * 60 * 12;

export async function createAdminSession(session: AdminSession) {
  const token = await sign({ ...session }, ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, { ...COOKIE_BASE, maxAge: ADMIN_MAX_AGE });
}

export async function getAdminSession() {
  return read<AdminSession>(ADMIN_COOKIE);
}

export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
