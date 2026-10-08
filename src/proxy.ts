import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_BASE,
  GREETING_COOKIE,
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

  const session = await verifyToken<{ registrantId?: string; email?: string; firstName?: string }>(
    request.cookies.get(PORTAL_COOKIE)?.value,
  );
  // Sign-ins from before the greeting cookie existed pick it up here.
  if (session?.firstName && !request.cookies.get(GREETING_COOKIE)) {
    response.cookies.set(GREETING_COOKIE, session.firstName, {
      ...COOKIE_BASE,
      httpOnly: false,
      maxAge: PORTAL_MAX_AGE,
    });
  }
  if (!session?.registrantId || !session.email || !session.iat) return;

  if (Date.now() / 1000 - session.iat < PORTAL_RENEW_AFTER) return;

  const token = await signToken(
    { registrantId: session.registrantId, email: session.email, firstName: session.firstName },
    PORTAL_MAX_AGE,
  );
  response.cookies.set(PORTAL_COOKIE, token, { ...COOKIE_BASE, maxAge: PORTAL_MAX_AGE });
}

/**
 * The public pages that are the same for every visitor. They're served as
 * cached copies (built every minute, not per request) so they cost the Worker
 * almost nothing, which keeps the site inside Cloudflare's free-plan CPU
 * limit. A cached copy can't carry a per-request nonce, so these pages allow
 * inline scripts instead. They render no visitor-supplied content, so the
 * nonce had little to guard there; everything that takes input or shows
 * personal data (registration, payment, the camp profile, admin) keeps it.
 */
const CACHED_PAGES = new Set(["/", "/about", "/vision", "/locations", "/events", "/give", "/camp"]);

export function isCachedPage(pathname: string) {
  return CACHED_PAGES.has(pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname);
}

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const cached = isCachedPage(request.nextUrl.pathname);
  const nonce = cached ? null : Buffer.from(crypto.randomUUID()).toString("base64");
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self' 'unsafe-inline'";

  const policy = [
    "default-src 'self'",
    `${scriptSrc}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Admin-managed hero media may be hosted on any https origin.
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    // Checkout redirects to Paystack. Browsers apply form-action to a form's
    // redirect too, so without this a pay button pressed before the page's
    // JavaScript loads (a plain form post) would be blocked on slow phones.
    "form-action 'self' https://checkout.paystack.com",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  // Next stamps the nonce into the page only when the request carries one;
  // a cached page must not, or its copy would hold a stale nonce.
  if (nonce) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", policy);
  }

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
