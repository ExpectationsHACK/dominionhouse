import { describe, expect, it } from "vitest";
import { hashCode, loginCode, paymentReference, qrPayload, registrationCode, ticketCode } from "@/lib/codes";

describe("codes", () => {
  it("issues FFC27 registration codes", () => {
    for (let i = 0; i < 50; i++) expect(registrationCode()).toMatch(/^FFC27-[2-9A-HJKMNP-Z]{6}$/);
  });

  it("issues TKT-FFC-27 ticket codes with no ambiguous characters", () => {
    for (let i = 0; i < 50; i++) expect(ticketCode()).toMatch(/^TKT-FFC-27-[2-9A-HJKMNP-Z]{5}$/);
  });

  it("makes QR payloads long and unique", () => {
    const seen = new Set(Array.from({ length: 200 }, () => qrPayload()));
    expect(seen.size).toBe(200);
    expect([...seen][0]).toHaveLength(24);
  });

  it("makes payment references with the expected prefix", () => {
    expect(paymentReference()).toMatch(/^DHC27-[0-9A-Z]+-[2-9A-HJKMNP-Z]{6}$/);
  });

  it("generates six-digit login codes and hashes deterministically", () => {
    for (let i = 0; i < 50; i++) expect(loginCode()).toMatch(/^\d{6}$/);
    expect(hashCode("123456")).toBe(hashCode("123456"));
    expect(hashCode("123456")).not.toBe(hashCode("654321"));
  });
});
