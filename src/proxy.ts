import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_BASE,
  PORTAL_COOKIE,
  PORTAL_MAX_AGE,
  PORTAL_RENEW_AFTER,
  signToken,
  verifyToken,
} from "@/lib/session-token";

/**
 * Content Security Policy with a per-request nonce.
 *
 * Scripts are locked to this origin plus the nonce Next attaches to its own
 * bootstrap and chunk tags ('strict-dynamic' lets those load their children).
 * That means an injected <script> or inline handler will not run, even if a
 * stray piece of unescaped text ever reaches the page.
 *
 * Styles keep 'unsafe-inline' because React's `style={{…}}` props render as
 * inline style attributes, which a nonce cannot cover. Style injection is a
 * much smaller risk than script injection.
 */
/**
 * Keeps a registrant signed in for as long as they keep using the site: a
 * login older than a day is re-issued with a fresh year on the next page visit.
 * Only page loads (GET) renew it. A sign-out is a POST that deletes the cookie,
 * and renewing on top of that would quietly undo it.
 */
async function renewPortalLogin(request: NextRequest, response: NextResponse) {
  if (request.method !== "GET" || !process.env.AUTH_SECRET) return;

  const session = await verifyToken<{ registrantId?: string; email?: string }>(
    request.cookies.get(PORTAL_COOKIE)?.value,
  );
  if (!session?.registrantId || !session.email || !session.iat) return;

  if (Date.now() / 1000 - session.iat < PORTAL_RENEW_AFTER) return;

  const token = await signToken(
    { registrantId: session.registrantId, email: session.email },
    PORTAL_MAX_AGE,
  );
  response.cookies.set(PORTAL_COOKIE, token, { ...COOKIE_BASE, maxAge: PORTAL_MAX_AGE });
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Admin-managed hero media may be hosted on any https origin.
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  await renewPortalLogin(request, response);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip API routes, build assets and prefetches.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
