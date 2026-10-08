import "server-only";
import { cookies } from "next/headers";
import type { AdminRole } from "@/generated/prisma/enums";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  COOKIE_BASE,
  GREETING_COOKIE,
  PORTAL_COOKIE,
  PORTAL_MAX_AGE,
  signToken,
  verifyToken,
} from "@/lib/session-token";

export { ADMIN_COOKIE, PORTAL_COOKIE };

/** firstName rides along so the site header can greet them without a database read. */
export type PortalSession = { registrantId: string; email: string; firstName?: string };
export type AdminSession = { adminId: string; email: string; name: string; role: AdminRole };

async function read<T>(name: string): Promise<T | null> {
  return verifyToken<T>((await cookies()).get(name)?.value);
}

// ── registrant portal, a year and renewed by use (see session-token.ts) ──────

export async function createPortalSession(session: PortalSession) {
  const token = await signToken({ ...session }, PORTAL_MAX_AGE);
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, token, { ...COOKIE_BASE, maxAge: PORTAL_MAX_AGE });
  if (session.firstName) {
    jar.set(GREETING_COOKIE, session.firstName, {
      ...COOKIE_BASE,
      httpOnly: false,
      maxAge: PORTAL_MAX_AGE,
    });
  }
}

export async function getPortalSession() {
  return read<PortalSession>(PORTAL_COOKIE);
}

export async function destroyPortalSession() {
  const jar = await cookies();
  jar.delete(PORTAL_COOKIE);
  jar.delete(GREETING_COOKIE);
}

// ── admin, 12 hours, a working day at the registration desk ──────────────────

export async function createAdminSession(session: AdminSession) {
  const token = await signToken({ ...session }, ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, { ...COOKIE_BASE, maxAge: ADMIN_MAX_AGE });
}

export async function getAdminSession() {
  return read<AdminSession>(ADMIN_COOKIE);
}

export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
