import { describe, expect, it } from "vitest";
import { normalizeEmail, phonesMatch } from "@/lib/utils";

describe("utils", () => {
  it("normalises emails", () => {
    expect(normalizeEmail("  Divine@Example.COM ")).toBe("divine@example.com");
  });

  it("matches the same Nigerian number typed different ways", () => {
    expect(phonesMatch("0803 123 4567", "+2348031234567")).toBe(true);
    expect(phonesMatch("08031234567", "2348031234567")).toBe(true);
  });

  it("does not match different numbers or empty input", () => {
    expect(phonesMatch("08031234567", "08031234568")).toBe(false);
    expect(phonesMatch("", "08031234567")).toBe(false);
  });
});
