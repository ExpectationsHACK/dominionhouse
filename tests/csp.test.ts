import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

describe("content security policy", () => {
  const policyFor = () =>
    proxy(new NextRequest("http://localhost:3001/camp")).headers.get("content-security-policy")!;

  it("sets a strict, nonce-based policy", () => {
    const policy = policyFor();
    expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
  });

  it("uses a fresh nonce on every request", () => {
    const nonce = (policy: string) => /'nonce-([^']+)'/.exec(policy)![1];
    expect(nonce(policyFor())).not.toBe(nonce(policyFor()));
  });
});
