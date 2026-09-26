import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { PORTAL_COOKIE, PORTAL_MAX_AGE, signToken, verifyToken } from "@/lib/session-token";

const DAY = 60 * 60 * 24;
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

/** A registrant login that was issued `ageSeconds` ago. */
async function loginIssued(ageSeconds: number, key = secret()) {
  const issuedAt = Math.floor(Date.now() / 1000) - ageSeconds;
  return new SignJWT({ registrantId: "reg_1", email: "a@b.co" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + PORTAL_MAX_AGE)
    .sign(key);
}

function visit(token: string, method = "GET") {
  return proxy(
    new NextRequest("http://localhost:3001/portal", {
      method,
      headers: { cookie: `${PORTAL_COOKIE}=${token}` },
    }),
  );
}

describe("registrant login lifetime", () => {
  it("lasts a year", async () => {
    const payload = await verifyToken(await signToken({ registrantId: "reg_1", email: "a@b.co" }, PORTAL_MAX_AGE));
    expect(payload!.exp! - payload!.iat!).toBe(365 * DAY);
  });

  it("is renewed on a page visit once it is more than a day old", async () => {
    const response = await visit(await loginIssued(3 * DAY));
    const renewed = response.cookies.get(PORTAL_COOKIE);

    expect(renewed).toBeDefined();
    expect(renewed!.maxAge).toBe(PORTAL_MAX_AGE);

    const payload = await verifyToken<{ registrantId: string; email: string }>(renewed!.value);
    expect(payload).toMatchObject({ registrantId: "reg_1", email: "a@b.co" });
    // Freshly issued, so its clock started again.
    expect(Date.now() / 1000 - payload!.iat!).toBeLessThan(60);
  });

  it("is left alone while it is less than a day old", async () => {
    const response = await visit(await loginIssued(60 * 60));
    expect(response.cookies.get(PORTAL_COOKIE)).toBeUndefined();
  });

  it("is never renewed by a POST, so signing out cannot be undone", async () => {
    const response = await visit(await loginIssued(3 * DAY), "POST");
    expect(response.cookies.get(PORTAL_COOKIE)).toBeUndefined();
  });

  it("is not renewed when the cookie is forged or expired", async () => {
    const forged = await loginIssued(3 * DAY, new TextEncoder().encode("some_other_secret_some_other_secret_00"));
    expect((await visit(forged)).cookies.get(PORTAL_COOKIE)).toBeUndefined();

    const expired = await loginIssued(366 * DAY);
    expect((await visit(expired)).cookies.get(PORTAL_COOKIE)).toBeUndefined();
  });
});
