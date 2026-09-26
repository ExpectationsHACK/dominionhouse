import { SignJWT, jwtVerify } from "jose";

/**
 * The signing and verifying half of the session cookies, kept free of
 * `next/headers` and `server-only` so the proxy can use it too (that is where a
 * registrant's login is renewed, see src/proxy.ts).
 */

export const PORTAL_COOKIE = "dh_portal";
export const ADMIN_COOKIE = "dh_admin";

/**
 * Registrants stay signed in for a year, renewed by use: registration opens
 * months before camp and the profile is still wanted after it, and signing
 * back in means finding the email and phone number again.
 */
export const PORTAL_MAX_AGE = 60 * 60 * 24 * 365;
/** A login older than this is re-issued on the next visit, so use keeps it alive. */
export const PORTAL_RENEW_AFTER = 60 * 60 * 24;

/** Admins: a working day at the registration desk. Deliberately short. */
export const ADMIN_MAX_AGE = 60 * 60 * 12;

export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev_secret_do_not_use_in_production_0000000000",
  );
}

/**
 * A missing secret must never fall back silently in production: that fallback
 * is a fixed string checked into the repo's history, so any session signed
 * with it is forgeable by anyone who has read this file. Checked lazily, on
 * first real sign/verify, rather than at module load, `next build` sets
 * NODE_ENV=production for the compile step itself, so throwing at import time
 * would fail every build, not just a misconfigured live deployment.
 */
export function assertSecretConfigured() {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Refusing to run in production, session cookies would be signed with a guessable key.",
    );
  }
}

export async function signToken(payload: Record<string, unknown>, maxAgeSeconds: number) {
  assertSecretConfigured();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secretKey());
}

export async function verifyToken<T>(token: string | undefined) {
  assertSecretConfigured();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as T & { iat?: number; exp?: number };
  } catch {
    return null;
  }
}
