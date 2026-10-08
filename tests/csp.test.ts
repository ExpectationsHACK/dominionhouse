import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isCachedPage, proxy } from "@/proxy";

const policyFor = async (path: string) =>
  (await proxy(new NextRequest(`http://localhost:3001${path}`))).headers.get(
    "content-security-policy",
  )!;

describe("content security policy", () => {
  it("sets a strict, nonce-based policy on pages that take input or show personal data", async () => {
    for (const path of ["/camp/register", "/camp/payment", "/portal", "/admin"]) {
      const policy = await policyFor(path);
      expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
      expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).toContain("base-uri 'self'");
    }
  });

  it("uses a fresh nonce on every request", async () => {
    const nonce = (policy: string) => /'nonce-([^']+)'/.exec(policy)![1];
    expect(nonce(await policyFor("/camp/register"))).not.toBe(nonce(await policyFor("/camp/register")));
  });

  it("gives the cached public pages a fixed policy with no nonce", async () => {
    for (const path of ["/", "/about", "/vision", "/locations", "/events", "/give", "/camp"]) {
      const policy = await policyFor(path);
      expect(policy).not.toContain("nonce-");
      expect(policy).toContain("script-src 'self' 'unsafe-inline'");
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
    }
  });

  it("only treats the listed public pages as cached", () => {
    expect(isCachedPage("/camp")).toBe(true);
    expect(isCachedPage("/camp/")).toBe(true);
    expect(isCachedPage("/camp/payment")).toBe(false);
    expect(isCachedPage("/portal")).toBe(false);
  });

  it("lets checkout's redirect to Paystack through, even from a plain form post", async () => {
    expect(await policyFor("/camp/payment")).toMatch(/form-action 'self' https:\/\/checkout\.paystack\.com(;|$)/);
  });
});
